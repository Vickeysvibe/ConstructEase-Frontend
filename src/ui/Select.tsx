import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export interface Option {
  value: string;
  label: string;
}

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size"> & {
  options: Option[];
  placeholder?: string;
};

const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;

/**
 * Custom dropdown with a native <select> underneath. The hidden select is the real form control —
 * it receives `ref`, `name`, `value`, `onChange` and `onBlur` exactly like before, so react-hook-form
 * `register`, `field` props and plain controlled usage all keep working. The visible part is an
 * accessible button + listbox (↑ ↓ Home End, type-ahead, Enter/Space, Esc).
 */
export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { options, placeholder, className, id, disabled, value, defaultValue, onChange, onBlur, name, style, ...rest },
  ref,
) {
  const select = useRef<HTMLSelectElement>(null);
  useImperativeHandle(ref, () => select.current!, []);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [current, setCurrent] = useState<string>(String(value ?? defaultValue ?? ""));
  const [pos, setPos] = useState<React.CSSProperties>({});
  const typed = useRef({ text: "", at: 0 });

  const all: Option[] = placeholder !== undefined ? [{ value: "", label: placeholder }, ...options] : options;

  // Uncontrolled forms (react-hook-form register/reset) write to the select directly: read it back after
  // every render. Guarded by the equality check, so it never loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const v = value !== undefined ? String(value ?? "") : (select.current?.value ?? "");
    if (v !== current) setCurrent(v);
  });

  const selected = all.find((o) => o.value === current);

  const place = useCallback(() => {
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const height = Math.min(280, all.length * 36 + 8);
    const up = below < height + 12 && r.top > below;
    setPos({
      position: "fixed",
      left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 180) - 8)),
      minWidth: r.width,
      ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }, [all.length]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!button.current?.contains(e.target as Node) && !list.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const choose = (v: string) => {
    const el = select.current;
    setOpen(false);
    button.current?.focus();
    if (!el || el.value === v) return;
    valueSetter?.call(el, v); // set like a user would, then let React see a real change event
    el.dispatchEvent(new Event("change", { bubbles: true }));
    setCurrent(v);
  };

  const openList = () => {
    if (disabled) return;
    setActive(Math.max(0, all.findIndex((o) => o.value === current)));
    setOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const last = all.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setActive((a) => Math.min(a + 1, last));
        return;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else setActive((a) => Math.max(a - 1, 0));
        return;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        return;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(last);
        }
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && all[active]) choose(all[active]!.value);
        else openList();
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
        return;
      case "Tab":
        setOpen(false);
        return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = all.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) {
        if (open) setActive(i);
        else choose(all[i]!.value);
      }
    }
  };

  return (
    <div className={clsx("ce-select", className)} style={style}>
      <select
        ref={select}
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(e) => {
          setCurrent(e.target.value);
          onChange?.(e);
        }}
        onBlur={onBlur}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        className="ce-select__native"
      >
        {all.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        ref={button}
        id={id}
        type="button"
        className="ce-input ce-select__button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!list.current?.contains(e.relatedTarget as Node)) select.current?.dispatchEvent(new Event("focusout", { bubbles: true }));
        }}
        {...(rest as Record<string, unknown>)}
      >
        <span className={clsx("ce-select__value", !selected?.value && placeholder !== undefined && "ce-select__value--placeholder")}>
          {selected?.label ?? placeholder ?? ""}
        </span>
        <ChevronDown aria-hidden className="ce-select__chevron" />
      </button>
      {open &&
        createPortal(
          <ul ref={list} id={listId} role="listbox" className="ce-select__list" style={pos} aria-labelledby={id}>
            {all.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={o.value === current}
                className={clsx("ce-select__opt", i === active && "ce-select__opt--active", o.value === "" && "ce-select__opt--empty")}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.value)}
              >
                <span>{o.label}</span>
                {o.value === current && <Check aria-hidden />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
});

import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

export interface ComboboxProps<T> extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onSelect"> {
  /** currently selected item */
  value: T | null;
  onChange: (item: T | null) => void;
  /** options for the current search text (filter server-side via onSearch, or pass a static list) */
  items: T[] | undefined;
  itemKey: (item: T) => string;
  itemLabel: (item: T) => string;
  /** secondary text under each option, e.g. unit and category */
  itemHint?: (item: T) => ReactNode;
  /** called (debounced by the caller if needed) whenever the typed text changes */
  onSearch?: (text: string) => void;
  loading?: boolean;
  emptyText?: string;
}

/**
 * Accessible searchable picker (WAI-ARIA combobox + listbox). Typing filters, ↑/↓ move, Enter picks,
 * Esc closes. Leaving the field with unmatched text restores the selected item's label.
 */
export function Combobox<T>({
  value,
  onChange,
  items,
  itemKey,
  itemLabel,
  itemHint,
  onSearch,
  loading,
  emptyText = "No matches",
  className,
  placeholder,
  ...inputProps
}: ComboboxProps<T>) {
  const listId = useId();
  const [text, setText] = useState(value ? itemLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedLabel = value ? itemLabel(value) : "";

  useEffect(() => {
    if (!open) setText(selectedLabel);
  }, [selectedLabel, open]);

  const visible = (onSearch ? items : items?.filter((i) => itemLabel(i).toLowerCase().includes(text.trim().toLowerCase()))) ?? [];
  useEffect(() => setActive(0), [text, items]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  const pick = (item: T) => {
    onChange(item);
    setText(itemLabel(item));
    setOpen(false);
  };

  return (
    <div className="ce-combo">
      <input
        {...inputProps}
        className={clsx("ce-input", className)}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && visible[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          onSearch?.(e.target.value.trim());
          if (value && e.target.value === "") onChange(null);
        }}
        onFocus={(e) => {
          setOpen(true);
          onSearch?.("");
          e.target.select();
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          // clicking an option fires mousedown first (preventDefault keeps focus), so blur means "leave"
          setOpen(false);
          setText(selectedLabel);
          inputProps.onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, Math.max(visible.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && visible[active]) {
            e.preventDefault();
            pick(visible[active]!);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
            setText(selectedLabel);
          }
        }}
      />
      {open && (
        <ul id={listId} role="listbox" className="ce-combo__list" ref={listRef}>
          {loading && !items ? (
            <li className="ce-combo__empty">Searching…</li>
          ) : visible.length === 0 ? (
            <li className="ce-combo__empty">{emptyText}</li>
          ) : (
            visible.map((item, i) => (
              <li
                key={itemKey(item)}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={value ? itemKey(value) === itemKey(item) : false}
                className={clsx("ce-combo__opt", i === active && "ce-combo__opt--active")}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(item)}
              >
                <span>{itemLabel(item)}</span>
                {itemHint && <small>{itemHint(item)}</small>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

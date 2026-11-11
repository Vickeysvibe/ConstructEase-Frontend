import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import clsx from "clsx";

/** Places a floating box next to an anchor, flipping above/below and clamping to the viewport. */
export function useFloating(open: boolean, prefer: "top" | "bottom" = "top", gap = 8) {
  const anchor = useRef<HTMLElement | null>(null);
  const floating = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999 });
  const [side, setSide] = useState<"top" | "bottom">(prefer);

  const update = useCallback(() => {
    const a = anchor.current?.getBoundingClientRect();
    const f = floating.current?.getBoundingClientRect();
    if (!a || !f) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fitsTop = a.top - f.height - gap > 4;
    const fitsBottom = a.bottom + f.height + gap < vh - 4;
    const s = prefer === "top" ? (fitsTop || !fitsBottom ? "top" : "bottom") : fitsBottom || !fitsTop ? "bottom" : "top";
    const top = s === "top" ? a.top - f.height - gap : a.bottom + gap;
    const left = Math.min(Math.max(8, a.left + a.width / 2 - f.width / 2), vw - f.width - 8);
    setSide(s);
    setStyle({ position: "fixed", top, left });
  }, [prefer, gap]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return { anchor, floating, style, side, update };
}

interface TooltipProps {
  /** tooltip text; keep it short — use HelpTip for explanations */
  content: ReactNode;
  /** a single focusable element */
  children: ReactElement;
  side?: "top" | "bottom";
  /** set when the child already has its own accessible name equal to the content */
  describe?: boolean;
}

/**
 * Shows `content` on hover and keyboard focus (after a short delay), dismisses on Escape.
 * Rendered in a portal so table cells and scroll containers never clip it.
 */
export function Tooltip({ content, children, side = "top", describe = true }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();
  const id = useId();
  const { anchor, floating, style, side: placed } = useFloating(open, side);

  const show = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), 250);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isValidElement(children)) return children;
  const child = children as ReactElement<Record<string, unknown>>;
  const props = child.props as Record<string, ((e: unknown) => void) | undefined>;
  const childRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;
  const trigger = cloneElement(child, {
    ref: (el: HTMLElement | null) => {
      anchor.current = el;
      if (typeof childRef === "function") childRef(el);
      else if (childRef && typeof childRef === "object") (childRef as React.MutableRefObject<HTMLElement | null>).current = el;
    },
    "aria-describedby": describe && open ? id : undefined,
    onMouseEnter: (e: unknown) => {
      show();
      props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: unknown) => {
      hide();
      props.onMouseLeave?.(e);
    },
    onFocus: (e: unknown) => {
      show();
      props.onFocus?.(e);
    },
    onBlur: (e: unknown) => {
      hide();
      props.onBlur?.(e);
    },
    onClick: (e: unknown) => {
      hide();
      props.onClick?.(e);
    },
  });
  return (
    <>
      {trigger}
      {open &&
        createPortal(
          <div ref={floating} id={id} role="tooltip" className={clsx("ce-tooltip", `ce-tooltip--${placed}`)} style={style}>
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

/** A small (?) that explains a page, section or field. Opens on hover, focus or tap. */
export function HelpTip({ title, children, label = "Help" }: { title?: string; children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const { anchor, floating, style, side } = useFloating(open, "bottom");
  const timer = useRef<number>();
  const close = useCallback(() => {
    setOpen(false);
    setPinned(false);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDoc = (e: MouseEvent) => {
      if (!anchor.current?.contains(e.target as Node) && !floating.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, close, anchor, floating]);
  return (
    <>
      <button
        ref={(el) => {
          anchor.current = el;
        }}
        type="button"
        className="ce-help"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          if (pinned) close();
          else {
            setOpen(true);
            setPinned(true);
          }
        }}
        onMouseEnter={() => {
          window.clearTimeout(timer.current);
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (!pinned) timer.current = window.setTimeout(() => setOpen(false), 150);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => !pinned && setOpen(false)}
      >
        <CircleHelp aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={floating}
            id={id}
            role="dialog"
            aria-label={title ?? label}
            className={clsx("ce-helptip", `ce-tooltip--${side}`)}
            style={style}
            onMouseEnter={() => window.clearTimeout(timer.current)}
            onMouseLeave={() => !pinned && setOpen(false)}
          >
            {title && <strong className="ce-helptip__title">{title}</strong>}
            <div className="ce-helptip__body">{children}</div>
          </div>,
          document.body,
        )}
    </>
  );
}

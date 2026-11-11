import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import { Button, IconButton } from "./Button";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Focus trap + Esc + restore focus, shared by Modal and Drawer. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const [head, tail] = [items[0]!, items[items.length - 1]!];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return createPortal(
    <div className="ce-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={clsx("ce-modal", wide && "ce-modal--wide")} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ce-modal__head">
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Close" icon={<X />} size="sm" onClick={onClose} />
        </div>
        <div className="ce-modal__body">{children}</div>
        {footer && <div className="ce-modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Side panel for create/edit forms. */
export function Drawer({ open, onClose, title, children, footer }: Omit<ModalProps, "wide">) {
  const ref = useDialog(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return createPortal(
    <div className="ce-overlay ce-drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="ce-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ce-modal__head">
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Close" icon={<X />} size="sm" onClick={onClose} />
        </div>
        <div className="ce-modal__body" style={{ flex: 1 }}>
          {children}
        </div>
        {footer && <div className="ce-modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ---------- Confirm (replaces window.confirm) ----------
interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
}
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback<ConfirmFn>((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = useCallback(
    (v: boolean) => {
      state?.resolve(v);
      setState(null);
    },
    [state],
  );
  const cancel = useCallback(() => close(false), [close]);
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={cancel}
        title={state?.title ?? ""}
        footer={
          <>
            <Button variant="ghost" onClick={cancel}>
              {state?.cancelLabel ?? "Cancel"}
            </Button>
            <Button variant={state?.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)} data-autofocus>
              {state?.confirmLabel}
            </Button>
          </>
        }
      >
        {typeof state?.message === "string" ? <p>{state.message}</p> : state?.message}
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** `const confirm = useConfirm(); if (await confirm({...})) …` */
export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return fn;
}

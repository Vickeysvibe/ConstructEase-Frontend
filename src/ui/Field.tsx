import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
  useEffect,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import clsx from "clsx";
import { toPaise } from "@/lib/format";

interface FieldProps {
  label: ReactNode;
  /** a single input element; it receives id / aria-* automatically */
  children: ReactElement;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

/** Label + control + hint/error, wired for accessibility. */
export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const id = useId();
  const childId = (isValidElement(children) && (children.props as { id?: string }).id) || id;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: childId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })
    : children;
  return (
    <div className={clsx("ce-field", className)}>
      <label className="ce-field__label" htmlFor={childId}>
        {label}
        {required && (
          <span className="ce-field__req" aria-hidden>
            *
          </span>
        )}
      </label>
      {control}
      {error ? (
        <span id={`${id}-err`} className="ce-field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="ce-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { numeric?: boolean }>(function Input(
  { className, numeric, ...rest },
  ref,
) {
  return <input ref={ref} className={clsx("ce-input", numeric && "ce-input--num", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={clsx("ce-input", className)} {...rest} />;
});

export interface Option {
  value: string;
  label: string;
}
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }
>(function Select({ className, options, placeholder, ...rest }, ref) {
  return (
    <select ref={ref} className={clsx("ce-input", className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
});

type ValueInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
};

/** Rupee input. Value and onChange are in **paise**; the user types rupees. */
export const MoneyInput = forwardRef<HTMLInputElement, ValueInputProps>(function MoneyInput(
  { value, onChange, className, onBlur, ...rest },
  ref,
) {
  const [text, setText] = useState(value == null ? "" : (value / 100).toFixed(2));
  useEffect(() => {
    const current = toPaise(text);
    if (value == null ? text !== "" : current !== value) setText(value == null ? "" : (value / 100).toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when the outside value changes
  }, [value]);
  return (
    <div className="ce-affix">
      <span className="ce-affix__part ce-affix__part--pre">₹</span>
      <input
        ref={ref}
        inputMode="decimal"
        className={clsx("ce-input ce-input--num", className)}
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d.,]/g, "");
          setText(t);
          const p = toPaise(t);
          onChange(t.trim() === "" ? null : Number.isNaN(p) ? null : p);
        }}
        onBlur={(e) => {
          if (value != null) setText((value / 100).toFixed(2));
          onBlur?.(e);
        }}
        {...rest}
      />
    </div>
  );
});

/** Quantity input (≤ 3 decimals) with an optional unit suffix. */
export const QtyInput = forwardRef<HTMLInputElement, ValueInputProps & { unit?: string }>(function QtyInput(
  { value, onChange, unit, className, ...rest },
  ref,
) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => {
    if (value == null ? text !== "" : Number(text) !== value) setText(value == null ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when the outside value changes
  }, [value]);
  const input = (
    <input
      ref={ref}
      inputMode="decimal"
      className={clsx("ce-input ce-input--num", className)}
      value={text}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.]/g, "");
        setText(t);
        const n = Number(t);
        onChange(t === "" || !Number.isFinite(n) ? null : Math.round(n * 1000) / 1000);
      }}
      {...rest}
    />
  );
  if (!unit) return input;
  return (
    <div className="ce-affix">
      {input}
      <span className="ce-affix__part ce-affix__part--post">{unit}</span>
    </div>
  );
});

export function Checkbox({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="ce-check">
      <input type="checkbox" {...rest} />
      {label}
    </label>
  );
}

/** Top-of-form error for problems that aren't tied to a single field. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="ce-form-error" role="alert">
      {message}
    </div>
  );
}

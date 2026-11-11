import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import clsx from "clsx";
import { Tooltip } from "./Tooltip";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  block?: boolean;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Common {
  loading?: boolean;
}

const cls = (variant: Variant, size: Size, block?: boolean, extra?: string) =>
  clsx("ce-btn", `ce-btn--${variant}`, size === "sm" && "ce-btn--sm", block && "ce-btn--block", extra);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, loading, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cls(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="ce-spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
});

/** Square icon-only button. `label` is required for screen readers and the tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "children"> & { label: string; icon: ReactNode }>(
  function IconButton({ label, icon, variant = "ghost", size = "md", className, ...rest }, ref) {
    return (
      <Tooltip content={label} describe={false}>
        <Button ref={ref} variant={variant} size={size} className={clsx("ce-btn--icon", className)} aria-label={label} {...rest}>
          {icon}
        </Button>
      </Tooltip>
    );
  },
);

/** A router link styled as a button. */
export function ButtonLink({ variant = "secondary", size = "md", icon, block, className, children, ...rest }: LinkProps & Common) {
  return (
    <Link className={cls(variant, size, block, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

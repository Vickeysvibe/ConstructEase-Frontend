import { createContext, useContext, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { AlertTriangle, Inbox } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/api/client";
import { titleCase } from "@/lib/format";
import { Button } from "./Button";
import { HelpTip } from "./Tooltip";

// ---------- PageHeader ----------
export interface PageHelp {
  title: string;
  body: ReactNode;
}
/** The app layout provides help for the current route; PageHeader shows it as a (?) next to the title. */
export const PageHelpContext = createContext<PageHelp | undefined>(undefined);

export function PageHeader({
  title,
  description,
  actions,
  help,
}: {
  title: ReactNode;
  /** @deprecated the breadcrumb bar shows the trail now */
  crumbs?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** overrides the route's help */
  help?: PageHelp | null;
}) {
  const routeHelp = useContext(PageHelpContext);
  const h = help === null ? undefined : (help ?? routeHelp);
  return (
    <header className="ce-page-header">
      <div className="ce-page-header__titles">
        <div className="ce-page-header__title-row">
          <h1>{title}</h1>
          {h && (
            <HelpTip title={h.title} label={`About this page: ${h.title}`}>
              {h.body}
            </HelpTip>
          )}
        </div>
        {description && <p className="ce-page-header__desc">{description}</p>}
      </div>
      {actions && <div className="ce-page-header__actions">{actions}</div>}
    </header>
  );
}

// ---------- Tabs ----------
/** Route tabs: each tab is a link, so every tab has its own URL. */
export function NavTabs({ tabs, label }: { tabs: { to: string; label: string; end?: boolean }[]; label: string }) {
  return (
    <nav className="ce-tabs" aria-label={label}>
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className="ce-tab">
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** In-page tabs bound to state. */
export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div className="ce-tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} className="ce-tab" onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Card ----------
export function Card({
  title,
  actions,
  children,
  flush,
  className,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={clsx("ce-card", className)}>
      {(title || actions) && (
        <div className="ce-card__head">
          {typeof title === "string" ? <h2>{title}</h2> : title}
          {actions && <div className="ce-row">{actions}</div>}
        </div>
      )}
      <div className={clsx("ce-card__body", flush && "ce-card__body--flush")}>{children}</div>
    </section>
  );
}

export function DescriptionList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="ce-dl">
      {items.map((it, i) => (
        <div key={i}>
          <dt>{it.label}</dt>
          <dd>{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- Badge ----------
export type Tone = "neutral" | "info" | "warn" | "ok" | "danger";
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`ce-badge ce-badge--${tone}`}>{children}</span>;
}

const STATUS_TONES: Record<string, Tone> = {
  draft: "neutral",
  sent: "info",
  partially_received: "warn",
  received: "ok",
  cancelled: "danger",
  posted: "ok",
  void: "danger",
  active: "ok",
  archived: "neutral",
  disabled: "danger",
  present: "ok",
  absent: "danger",
  queued: "neutral",
  running: "info",
  done: "ok",
  failed: "danger",
};
/** Wording users see where the API status name would mislead (a "sent" PO is issued, not emailed). */
const STATUS_LABELS: Record<string, string> = { sent: "Issued", partially_received: "Partially received" };

/** Badge for any status string used by the API. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{label ?? STATUS_LABELS[status] ?? titleCase(status)}</Badge>;
}

// ---------- Stat ----------
export function StatCard({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="ce-stat">
      <span className="ce-stat__label">{label}</span>
      <span className="ce-stat__value">{value}</span>
      {sub && <span className="ce-stat__sub">{sub}</span>}
    </div>
  );
}

// ---------- States ----------
export function EmptyState({
  title,
  description,
  action,
  icon,
  plain,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  plain?: boolean;
}) {
  return (
    <div className={clsx("ce-empty", plain && "ce-empty--plain")}>
      {icon ?? <Inbox aria-hidden />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ width = "100%", height = 12 }: { width?: string | number; height?: number }) {
  return <div className="ce-skel" style={{ width, height }} aria-hidden />;
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="ce-loading-block" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} width={`${90 - ((i * 17) % 35)}%`} />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="ce-error-state" role="alert">
      <div className="ce-row">
        <AlertTriangle aria-hidden size={18} />
        <span>{errorMessage(error)}</span>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ---------- Toasts ----------
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.userMessage;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export const notify = {
  success: (message: string) => toast.success(message, { className: "ce-toast", style: { borderLeftColor: "var(--ce-ok)" } }),
  error: (err: unknown) =>
    toast.error(errorMessage(err), { className: "ce-toast", style: { borderLeftColor: "var(--ce-danger)" }, duration: 6000 }),
  info: (message: string) => toast(message, { className: "ce-toast", style: { borderLeftColor: "var(--ce-interactive)" } }),
};

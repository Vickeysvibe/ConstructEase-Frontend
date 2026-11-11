import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useBlocker, type BlockerFunction } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Lock, Minus, Plus, RefreshCw, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { AttendanceRow, AttendanceSaveInput, AttendanceSheet } from "@/lib/api/types";
import { addDays, date as fmtDate, money, moneyShort } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import { useSite } from "@/app/site";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  DateStepper,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingBlock,
  Modal,
  NavTabs,
  PageHeader,
  SearchInput,
  Select,
  StatCard,
  notify,
  useConfirm,
} from "@/ui";
import {
  SHIFT_MAX,
  SHIFT_MIN,
  changedEntries,
  effectiveMark,
  filterRows,
  formatShifts,
  liveSummary,
  refreshPayload,
  rowErrors,
  savePayload,
  trades,
  withAllPresent,
  withShiftStep,
  withStatus,
  type Edits,
  type Mark,
  type Status,
} from "./attendanceModel";
import { attendanceTabs, useToday } from "./shared";
import "./attendance.css";

function dayHint(d: string, todayStr: string) {
  if (d === todayStr) return "Today";
  if (d === addDays(todayStr, -1)) return "Yesterday";
  const [y, m, day] = d.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(new Date(y!, m! - 1, day!));
}

/** Daily labour attendance: mark present/absent + shifts for everyone, save in one go. */
export default function AttendancePage() {
  const site = useSite();
  const todayStr = useToday();
  const [params, setParams] = useListParams<{ date: string; trade: string }>();
  const requested = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayStr;
  const day = requested > todayStr ? todayStr : requested;
  const setDay = (d: string) => setParams({ date: d === todayStr ? undefined : d > todayStr ? undefined : d });

  return (
    <div className="ce-page">
      <PageHeader title="Labour attendance" description={`${fmtDate(day)} · ${dayHint(day, todayStr)}`} />
      <NavTabs label="Attendance" tabs={attendanceTabs(site.to)} />
      <DateStepper label="Attendance date" value={day} max={todayStr} today={todayStr} onChange={setDay} />
      <SheetView key={day} day={day} q={params.q ?? ""} trade={params.trade ?? ""} setFilter={setParams} />
    </div>
  );
}

function SheetView({
  day,
  q,
  trade,
  setFilter,
}: {
  day: string;
  q: string;
  trade: string;
  setFilter: (p: Record<string, string | undefined>) => void;
}) {
  const site = useSite();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const todayStr = useToday();
  const key = ["attendance", site.site.id, day];
  const query = useQuery({ queryKey: key, queryFn: () => api.get<AttendanceSheet>(`${site.base}/attendance`, { date: day }) });
  const [edits, setEdits] = useState<Edits>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sheet = query.data;
  const rows = useMemo(() => sheet?.rows ?? [], [sheet]);
  const changes = useMemo(() => changedEntries(rows, edits), [rows, edits]);
  const dirty = changes.length > 0;
  const editable = !!sheet?.editable && site.can("attendance:write");
  const showWages = site.can("finance:read");

  // Warn before leaving (other page, other date, reload) with unsaved marks. Search / trade filter changes are fine.
  const blocker = useBlocker(
    useCallback<BlockerFunction>(
      ({ currentLocation, nextLocation }) => {
        if (!dirty) return false;
        const d = (search: string) => new URLSearchParams(search).get("date") ?? todayStr;
        return currentLocation.pathname !== nextLocation.pathname || d(currentLocation.search) !== d(nextLocation.search);
      },
      [dirty, todayStr],
    ),
  );
  useEffect(() => {
    if (!dirty) return;
    const on = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", on);
    return () => window.removeEventListener("beforeunload", on);
  }, [dirty]);

  const save = useMutation({
    mutationFn: (body: AttendanceSaveInput) => api.put<AttendanceSheet>(`${site.base}/attendance`, body),
    onSuccess: (next, body) => {
      qc.setQueryData(key, next);
      setEdits({});
      setErrors({});
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      notify.success(
        body.refreshRates
          ? `Wage rates refreshed for ${fmtDate(day)}.`
          : `Attendance saved for ${fmtDate(day)} (${body.entries.length} ${body.entries.length === 1 ? "change" : "changes"}).`,
      );
    },
    onError: (err, body) => {
      const perRow = err instanceof ApiError ? rowErrors(err.errors, body.entries) : {};
      const n = Object.keys(perRow).length;
      setErrors(perRow);
      if (n) notify.error(new Error(`Nothing was saved: ${n} ${n === 1 ? "row needs" : "rows need"} attention. Fix the highlighted rows and save again.`));
      else notify.error(err);
    },
  });

  const clearError = useCallback((id: string) => setErrors((e) => (e[id] ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== id)) : e)), []);
  const onStatus = useCallback(
    (row: AttendanceRow, status: Status) => {
      setEdits((e) => withStatus(e, row, status));
      clearError(row.labourId);
    },
    [clearError],
  );
  const onStep = useCallback(
    (row: AttendanceRow, dir: 1 | -1) => {
      setEdits((e) => withShiftStep(e, row, dir));
      clearError(row.labourId);
    },
    [clearError],
  );

  if (query.isLoading) return <LoadingBlock rows={8} />;
  if (query.error || !sheet) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  if (sheet.rows.length === 0) {
    return (
      <EmptyState
        icon={<Users aria-hidden />}
        title="No labour on this site yet"
        description="Add your masons, helpers and other workers with their trade and wage per shift. They'll appear here to mark attendance."
        action={
          <ButtonLink variant="primary" to={site.to("masters/labour")}>
            Go to Masters › Labour
          </ButtonLink>
        }
      />
    );
  }

  const summary = liveSummary(rows, edits);
  const filtered = filterRows(rows, q, trade);
  const toMarkPresent = filtered.filter((r) => effectiveMark(r, edits)?.status !== "present").length;
  const canRefresh = editable && site.can("attendance:backdate") && rows.some((r) => effectiveMark(r, edits));

  const refreshRates = async () => {
    const body = refreshPayload(day, rows, edits);
    const ok = await confirm({
      title: "Refresh wage rates?",
      message: `Each of the ${body.entries.length} marked labourers on ${fmtDate(day)} will be re-costed at their current wage per shift.${
        dirty ? " Your unsaved changes will be saved too." : ""
      } This changes the day's wage total.`,
      confirmLabel: "Refresh rates",
    });
    if (ok) save.mutate(body);
  };

  const readOnlyReason = !site.can("attendance:write")
    ? site.archived
      ? "This site is archived, so attendance can't be changed."
      : "Your role can view attendance but not mark it."
    : !sheet.editable
      ? site.can("attendance:backdate")
        ? "This date can't be edited."
        : "Supervisors can mark attendance for today and yesterday only. Ask an engineer to correct older days."
      : null;

  return (
    <>
      <div className="ce-stats att-stats" aria-live="polite">
        <StatCard label="Present" value={summary.present} />
        <StatCard label="Absent" value={summary.absent} />
        <StatCard label="Unmarked" value={summary.unmarked} />
        <StatCard label="Shifts" value={formatShifts(summary.shifts)} />
        {showWages && <StatCard label="Wages" value={moneyShort(summary.wagesPaise)} sub={dirty ? "incl. unsaved" : undefined} />}
      </div>

      {readOnlyReason && (
        <div className="att-readonly" role="note">
          <Lock aria-hidden size={16} />
          <span>{readOnlyReason}</span>
        </div>
      )}

      <Card flush>
        <div className="ce-table-toolbar">
          <div className="ce-table-toolbar__left">
            <SearchInput value={q} onChange={(v) => setFilter({ q: v })} placeholder="Search name or phone…" label="Search labour" />
            <Select
              aria-label="Trade"
              value={trade}
              onChange={(e) => setFilter({ trade: e.target.value || undefined })}
              options={trades(rows).map((t) => ({ value: t, label: t }))}
              placeholder="All trades"
              style={{ width: "auto" }}
            />
          </div>
          <div className="ce-row">
            {canRefresh && (
              <Button icon={<RefreshCw />} onClick={() => void refreshRates()} disabled={save.isPending}>
                Refresh wage rates
              </Button>
            )}
            {editable && (
              <Button icon={<CheckCheck />} disabled={toMarkPresent === 0} onClick={() => setEdits((e) => withAllPresent(e, filtered))}>
                Mark all present{q || trade ? " (shown)" : ""}
              </Button>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 16 }}>
            <EmptyState plain title="No one matches" description="Try a different name or clear the trade filter." />
          </div>
        ) : (
          <ul className="att-list" aria-label={`Labour on ${fmtDate(day)}`}>
            {filtered.map((row) => (
              <LabourRow
                key={row.labourId}
                row={row}
                mark={effectiveMark(row, edits)}
                changed={row.labourId in edits}
                error={errors[row.labourId]}
                editable={editable}
                showWage={showWages}
                onStatus={onStatus}
                onStep={onStep}
              />
            ))}
          </ul>
        )}
      </Card>

      {editable && dirty && (
        <div className="att-savebar" role="region" aria-label="Unsaved attendance">
          <span className="att-savebar__text">
            {changes.length} unsaved {changes.length === 1 ? "change" : "changes"}
          </span>
          <Button
            variant="ghost"
            disabled={save.isPending}
            onClick={() => {
              setEdits({});
              setErrors({});
            }}
          >
            Discard
          </Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate(savePayload(day, rows, edits))}>
            Save {changes.length} {changes.length === 1 ? "change" : "changes"}
          </Button>
        </div>
      )}

      <Modal
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Leave without saving?"
        footer={
          <>
            <Button variant="ghost" onClick={() => blocker.reset?.()} data-autofocus>
              Stay and save
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              Discard changes
            </Button>
          </>
        }
      >
        <p>
          You have {changes.length} unsaved attendance {changes.length === 1 ? "change" : "changes"} for {fmtDate(day)}. They'll be lost
          if you leave.
        </p>
      </Modal>
    </>
  );
}

const LabourRow = memo(function LabourRow({
  row,
  mark,
  changed,
  error,
  editable,
  showWage,
  onStatus,
  onStep,
}: {
  row: AttendanceRow;
  mark: Mark | null;
  changed: boolean;
  error?: string;
  editable: boolean;
  showWage: boolean;
  onStatus: (row: AttendanceRow, s: Status) => void;
  onStep: (row: AttendanceRow, dir: 1 | -1) => void;
}) {
  const present = mark?.status === "present";
  const rate = row.entry?.wageRatePaise ?? row.wageRatePaise;
  const trade = [row.category, row.subCategory].filter(Boolean).join(" · ") || "No trade";
  return (
    <li className="att-row" data-changed={changed || undefined} data-error={error ? true : undefined}>
      <div className="att-row__who">
        <strong className="att-row__name">{row.name}</strong>
        <span className="att-row__meta">
          {trade}
          {showWage && ` · ${money(rate)}/shift`}
          {changed && <span className="att-row__flag"> · unsaved</span>}
        </span>
        {error && (
          <span className="att-row__error" role="alert">
            {error}
          </span>
        )}
      </div>
      {editable ? (
        <div className="att-row__controls">
          <div className="att-toggle" role="group" aria-label={`Attendance for ${row.name}`}>
            <Button className="att-toggle__btn att-toggle__btn--present" aria-pressed={present} onClick={() => onStatus(row, "present")}>
              Present
            </Button>
            <Button className="att-toggle__btn att-toggle__btn--absent" aria-pressed={mark?.status === "absent"} onClick={() => onStatus(row, "absent")}>
              Absent
            </Button>
          </div>
          {present && (
            <div className="att-stepper" role="group" aria-label={`Shifts for ${row.name}`}>
              <IconButton variant="secondary" label={`Fewer shifts for ${row.name}`} icon={<Minus />} disabled={mark.shifts <= SHIFT_MIN} onClick={() => onStep(row, -1)} />
              <output className="att-stepper__value" aria-label={`${row.name} shifts`}>
                {formatShifts(mark.shifts)}
              </output>
              <IconButton variant="secondary" label={`More shifts for ${row.name}`} icon={<Plus />} disabled={mark.shifts >= SHIFT_MAX} onClick={() => onStep(row, 1)} />
            </div>
          )}
        </div>
      ) : (
        <div className="att-row__controls">
          {mark ? (
            <>
              <Badge tone={present ? "ok" : "danger"}>{present ? "Present" : "Absent"}</Badge>
              {present && <span className="ce-num">{formatShifts(mark.shifts)} shift{mark.shifts === 1 ? "" : "s"}</span>}
            </>
          ) : (
            <Badge>Not marked</Badge>
          )}
        </div>
      )}
    </li>
  );
});

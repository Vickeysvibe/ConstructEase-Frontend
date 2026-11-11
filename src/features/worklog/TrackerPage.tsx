import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Columns3, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { List, Tracker, TrackerColumn, TrackerRow } from "@/lib/api/types";
import { date as fmtDate, qty } from "@/lib/format";
import { useListParams } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { useCrumbLabel } from "@/app/Breadcrumbs";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  ErrorState,
  FormError,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
  notify,
  useConfirm,
  type ColumnDef,
} from "@/ui";
import { ColumnsEditor } from "./ColumnsEditor";
import { RowDrawer } from "./RowDrawer";
import {
  applyTrackerErrors,
  columnToDraft,
  draftToColumn,
  removedColumns,
  trackerSchema,
  type TrackerForm,
} from "./trackerForm";
import { trackersKey, useTrackers } from "./useTrackers";
import "./worklog.css";

function Cell({ col, value }: { col: TrackerColumn; value: string | number | null | undefined }) {
  if (value == null || value === "") return <span className="ce-muted">—</span>;
  switch (col.type) {
    case "date":
      return <span className="ce-num">{fmtDate(String(value))}</span>;
    case "number":
      return <span className="ce-num">{typeof value === "number" ? qty(value) : value}</span>;
    case "status":
      return <Badge tone="info">{String(value)}</Badge>;
    default:
      return <span className="wl-cell-text">{String(value)}</span>;
  }
}

/** One tracker: its rows as a table, with add/edit/delete and column editing. */
export default function TrackerPage() {
  const { trackerId = "" } = useParams();
  const site = useSite();
  const trackers = useTrackers();
  const tracker = trackers.data?.items.find((t) => t.id === trackerId);
  useCrumbLabel(tracker?.name);

  if (trackers.isLoading) return <LoadingBlock rows={6} />;
  if (trackers.error) return <ErrorState error={trackers.error} onRetry={() => void trackers.refetch()} />;
  if (!tracker)
    return (
      <div className="ce-page">
        <EmptyState
          title="Tracker not found"
          description="It may have been deleted."
          action={<Link to={site.to("worklog")}>Back to trackers</Link>}
        />
      </div>
    );
  return <TrackerView tracker={tracker} />;
}

function TrackerView({ tracker }: { tracker: Tracker }) {
  const site = useSite();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const canWrite = site.can("worklog:write");
  const [params, setParams] = useListParams<{ done: string }>();
  const [editing, setEditing] = useState<TrackerRow | "new" | null>(null);
  const [editingColumns, setEditingColumns] = useState(false);
  const rowsBase = `${site.base}/trackers/${tracker.id}/rows`;

  const query = useQuery({
    queryKey: [...trackersKey(site.site.id), tracker.id, "rows", params],
    queryFn: () => api.get<List<TrackerRow>>(rowsBase, params),
    placeholderData: keepPreviousData,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: trackersKey(site.site.id) });

  const toggleDone = useMutation({
    mutationFn: (r: TrackerRow) => api.patch<TrackerRow>(`${rowsBase}/${r.id}`, { done: !r.done }),
    onSuccess: () => void invalidate(),
    onError: (e) => notify.error(e),
  });
  const removeRow = useMutation({
    mutationFn: (r: TrackerRow) => api.delete(`${rowsBase}/${r.id}`),
    onSuccess: () => {
      notify.success("Row deleted.");
      void invalidate();
    },
    onError: (e) => notify.error(e),
  });
  const removeTracker = useMutation({
    mutationFn: () => api.delete(`${site.base}/trackers/${tracker.id}${tracker.rowCount > 0 ? "?force=true" : ""}`),
    onSuccess: () => {
      notify.success(`${tracker.name} deleted.`);
      qc.removeQueries({ queryKey: [...trackersKey(site.site.id), tracker.id] });
      void invalidate();
      navigate(site.to("worklog"));
    },
    onError: (e) => notify.error(e),
  });

  const columns = useMemo<ColumnDef<TrackerRow, unknown>[]>(() => {
    const cols: ColumnDef<TrackerRow, unknown>[] = [
      {
        id: "done",
        header: "Done",
        size: 56,
        cell: ({ row }) =>
          canWrite ? (
            <Checkbox
              label={<span className="ce-visually-hidden">Done</span>}
              checked={row.original.done}
              disabled={toggleDone.isPending && toggleDone.variables?.id === row.original.id}
              onChange={() => toggleDone.mutate(row.original)}
            />
          ) : row.original.done ? (
            <Badge tone="ok">Done</Badge>
          ) : (
            <Badge>Open</Badge>
          ),
      },
      ...tracker.columns.map<ColumnDef<TrackerRow, unknown>>((c, i) => ({
        id: c.key,
        header: c.label,
        meta: { sortKey: c.key, numeric: c.type === "number", hideBelow: i >= 2 ? 700 : undefined },
        cell: ({ row }) => <Cell col={c} value={row.original.values[c.key]} />,
      })),
    ];
    if (canWrite)
      cols.push({
        id: "actions",
        header: () => <span className="ce-visually-hidden">Actions</span>,
        size: 88,
        cell: ({ row }) => (
          <div className="ce-row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
            <IconButton size="sm" label="Edit row" icon={<Pencil />} onClick={() => setEditing(row.original)} />
            <IconButton
              size="sm"
              label="Delete row"
              icon={<Trash2 />}
              onClick={async () => {
                if (await confirm({ title: "Delete this row?", message: "This can't be undone.", confirmLabel: "Delete row", tone: "danger" })) removeRow.mutate(row.original);
              }}
            />
          </div>
        ),
      });
    return cols;
  }, [tracker.columns, canWrite, toggleDone, removeRow, confirm]);

  const deleteTracker = async () => {
    const ok = await confirm({
      title: `Delete ${tracker.name}?`,
      message:
        tracker.rowCount > 0
          ? `Its ${tracker.rowCount} ${tracker.rowCount === 1 ? "row" : "rows"} will be deleted too. This can't be undone.`
          : "This can't be undone.",
      confirmLabel: "Delete tracker",
      tone: "danger",
    });
    if (ok) removeTracker.mutate();
  };

  const filtered = !!(params.q || params.done);
  return (
    <div className="ce-page">
      <PageHeader
        title={tracker.name}
        description={`${tracker.rowCount} ${tracker.rowCount === 1 ? "row" : "rows"}`}
        actions={
          canWrite && (
            <>
              <Button icon={<Trash2 />} variant="ghost" loading={removeTracker.isPending} onClick={() => void deleteTracker()}>
                Delete tracker
              </Button>
              <Button icon={<Columns3 />} onClick={() => setEditingColumns(true)}>
                Edit columns
              </Button>
              <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
                Add row
              </Button>
            </>
          )
        }
      />
      <DataTable
        columns={columns}
        data={query.data?.items}
        rowKey={(r) => r.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={params.page}
        pageSize={params.pageSize}
        total={query.data?.total}
        onPageChange={(page) => setParams({ page })}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        onRowClick={canWrite ? (r) => setEditing(r) : undefined}
        caption={tracker.name}
        search={{ value: params.q ?? "", onChange: (q) => setParams({ q }), label: `Search ${tracker.name}` }}
        onPageSizeChange={(pageSize) => setParams({ pageSize })}
        filters={
          <>
            <Select
              aria-label="Show"
              value={params.done ?? ""}
              onChange={(e) => setParams({ done: e.target.value || undefined })}
              options={[
                { value: "false", label: "Open only" },
                { value: "true", label: "Done only" },
              ]}
              placeholder="All rows"
            />
          </>
        }
        empty={
          filtered ? (
            <EmptyState plain title="No rows match" description="Try another search or show all rows." />
          ) : (
            <EmptyState
              plain
              title="No rows yet"
              description="Each row is one item in this tracker. Tick it off when it's done."
              action={
                canWrite ? (
                  <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
                    Add row
                  </Button>
                ) : undefined
              }
            />
          )
        }
      />
      {editing && (
        <RowDrawer
          tracker={tracker}
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void invalidate();
          }}
        />
      )}
      {editingColumns && <ColumnsModal tracker={tracker} onClose={() => setEditingColumns(false)} />}
    </div>
  );
}

function ColumnsModal({ tracker, onClose }: { tracker: Tracker; onClose: () => void }) {
  const site = useSite();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TrackerForm>({
    resolver: zodResolver(trackerSchema),
    defaultValues: { name: tracker.name, columns: tracker.columns.map(columnToDraft) },
  });
  const save = useMutation({
    mutationFn: (v: TrackerForm) => api.patch<Tracker>(`${site.base}/trackers/${tracker.id}`, { name: v.name.trim(), columns: v.columns.map(draftToColumn) }),
    onSuccess: () => {
      notify.success("Columns saved.");
      void qc.invalidateQueries({ queryKey: trackersKey(site.site.id) });
      onClose();
    },
    onError: (err) => setFormError(applyTrackerErrors(err, form.setError)),
  });
  const submit = form.handleSubmit(async (v) => {
    setFormError(null);
    const removed = removedColumns(tracker.columns, v.columns);
    if (removed.length && tracker.rowCount > 0) {
      const ok = await confirm({
        title: `Remove ${removed.length === 1 ? "a column" : `${removed.length} columns`}?`,
        message: `The values in ${removed.map((c) => `"${c.label}"`).join(", ")} will be deleted from all ${tracker.rowCount} ${
          tracker.rowCount === 1 ? "row" : "rows"
        }. This can't be undone.`,
        confirmLabel: "Remove and save",
        tone: "danger",
      });
      if (!ok) return;
    }
    save.mutate(v);
  });
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Edit columns"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="columns-form" loading={save.isPending}>
            Save columns
          </Button>
        </>
      }
    >
      <form id="columns-form" noValidate className="ce-stack" onSubmit={(e) => void submit(e)}>
        <FormError message={formError} />
        <ColumnsEditor form={form} saved={tracker.columns} />
      </form>
    </Modal>
  );
}

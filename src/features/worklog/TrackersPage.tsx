import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Tracker } from "@/lib/api/types";
import { useSite } from "@/app/site";
import { Badge, Button, Drawer, EmptyState, ErrorState, FormError, LoadingBlock, PageHeader, notify } from "@/ui";
import { ColumnsEditor } from "./ColumnsEditor";
import { applyTrackerErrors, blankColumn, draftToColumn, trackerSchema, type TrackerForm } from "./trackerForm";
import { trackersKey, useTrackers } from "./useTrackers";
import "./worklog.css";

const KIND_LABEL: Record<Tracker["kind"], string> = { todo: "To-do", work: "Work done", custom: "Custom" };

/** The site's trackers: To-do, Work done and any custom tables. */
export default function TrackersPage() {
  const site = useSite();
  const query = useTrackers();
  const [creating, setCreating] = useState(false);
  const canWrite = site.can("worklog:write");

  return (
    <div className="ce-page">
      <PageHeader
        title="Trackers"
        description="Simple tables for the site's to-dos, work done, snags or anything else you want to keep track of."
        actions={
          canWrite && (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              New tracker
            </Button>
          )
        }
      />
      {query.isLoading ? (
        <LoadingBlock rows={4} />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data?.items.length ? (
        <EmptyState
          icon={<ClipboardList aria-hidden />}
          title="No trackers yet"
          description="Create a tracker with your own columns — for example a snag list with Location, Issue and Status."
          action={
            canWrite ? (
              <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
                New tracker
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="wl-grid">
          {query.data.items.map((t) => (
            <Link key={t.id} to={site.to(`worklog/${t.id}`)} className="wl-card">
              <div className="wl-card__head">
                <h2>{t.name}</h2>
                <Badge tone={t.kind === "custom" ? "neutral" : "info"}>{KIND_LABEL[t.kind]}</Badge>
              </div>
              <span className="ce-num">
                {t.rowCount} {t.rowCount === 1 ? "row" : "rows"}
              </span>
              <span className="wl-card__meta">{t.columns.map((c) => c.label).join(" · ")}</span>
            </Link>
          ))}
        </div>
      )}
      {creating && <CreateTrackerDrawer onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateTrackerDrawer({ onClose }: { onClose: () => void }) {
  const site = useSite();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TrackerForm>({
    resolver: zodResolver(trackerSchema),
    defaultValues: { name: "", columns: [{ ...blankColumn(), label: "Item", required: true }] },
  });
  const save = useMutation({
    mutationFn: (v: TrackerForm) => api.post<Tracker>(`${site.base}/trackers`, { name: v.name.trim(), kind: "custom", columns: v.columns.map(draftToColumn) }),
    onSuccess: (t) => {
      notify.success(`${t.name} created.`);
      void qc.invalidateQueries({ queryKey: trackersKey(site.site.id) });
      navigate(site.to(`worklog/${t.id}`));
    },
    onError: (err) => setFormError(applyTrackerErrors(err, form.setError)),
  });
  return (
    <Drawer
      open
      onClose={onClose}
      title="New tracker"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="tracker-form" loading={save.isPending}>
            Create tracker
          </Button>
        </>
      }
    >
      <form
        id="tracker-form"
        noValidate
        className="ce-stack"
        onSubmit={form.handleSubmit((v) => {
          setFormError(null);
          save.mutate(v);
        })}
      >
        <FormError message={formError} />
        <ColumnsEditor form={form} />
      </form>
    </Drawer>
  );
}

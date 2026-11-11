import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { List, Note } from "@/lib/api/types";
import { dateTime } from "@/lib/format";
import { applyFieldErrors, useListParams } from "@/lib/hooks";
import { useSite } from "@/app/site";
import {
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FormError,
  IconButton,
  Input,
  PageHeader,
  SearchInput,
  Textarea,
  notify,
  useConfirm,
  type ColumnDef,
} from "@/ui";
import { noteSchema, type NoteForm } from "./noteForm";
import "./notes.css";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};
const snippet = (body: string) => (body.length > 160 ? `${body.slice(0, 160).trimEnd()}…` : body);

/** Site notes: decisions, measurements, phone numbers — anything worth writing down. */
export default function NotesPage() {
  const site = useSite();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [params, setParams] = useListParams();
  const [editing, setEditing] = useState<Note | "new" | null>(null);
  const canWrite = site.can("notes:write");
  const query = useQuery({
    queryKey: ["notes", site.site.id, params],
    queryFn: () => api.get<List<Note>>(`${site.base}/notes`, params),
    placeholderData: keepPreviousData,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notes", site.site.id] });
  const remove = useMutation({
    mutationFn: (n: Note) => api.delete(`${site.base}/notes/${n.id}`),
    onSuccess: () => {
      notify.success("Note deleted.");
      void invalidate();
    },
    onError: (e) => notify.error(e),
  });

  const columns = useMemo<ColumnDef<Note, unknown>[]>(() => {
    const cols: ColumnDef<Note, unknown>[] = [
      {
        id: "title",
        header: "Note",
        meta: { sortKey: "title" },
        cell: ({ row }) => (
          <div className="ce-stack" style={{ gap: 2 }}>
            <strong>{row.original.title}</strong>
            {row.original.body && <span className="notes-snippet">{snippet(row.original.body)}</span>}
          </div>
        ),
      },
      {
        id: "link",
        header: "Link",
        meta: { hideBelow: 700 },
        cell: ({ row }) =>
          row.original.link ? (
            <a className="notes-link" href={row.original.link} target="_blank" rel="noreferrer noopener">
              <ExternalLink size={14} aria-hidden /> {hostOf(row.original.link)}
            </a>
          ) : (
            "—"
          ),
      },
      { id: "author", header: "By", meta: { hideBelow: 900 }, cell: ({ row }) => row.original.createdBy.name },
      { id: "updatedAt", header: "Updated", meta: { sortKey: "updatedAt", hideBelow: 560 }, cell: ({ row }) => <span className="ce-num">{dateTime(row.original.updatedAt)}</span> },
    ];
    if (canWrite)
      cols.push({
        id: "actions",
        header: () => <span className="ce-visually-hidden">Actions</span>,
        size: 88,
        cell: ({ row }) => (
          <div className="ce-row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
            <IconButton size="sm" label="Edit note" icon={<Pencil />} onClick={() => setEditing(row.original)} />
            <IconButton
              size="sm"
              label="Delete note"
              icon={<Trash2 />}
              onClick={async () => {
                if (await confirm({ title: `Delete "${row.original.title}"?`, message: "This can't be undone.", confirmLabel: "Delete note", tone: "danger" }))
                  remove.mutate(row.original);
              }}
            />
          </div>
        ),
      });
    return cols;
  }, [canWrite, confirm, remove]);

  return (
    <div className="ce-page">
      <PageHeader
        title="Notes"
        description="Decisions, measurements, contacts — anything the team should be able to find later."
        actions={
          canWrite && (
            <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
              New note
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={query.data?.items}
        rowKey={(n) => n.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={params.page}
        pageSize={params.pageSize}
        total={query.data?.total}
        onPageChange={(page) => setParams({ page })}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        onRowClick={canWrite ? (n) => setEditing(n) : undefined}
        caption="Notes"
        toolbar={<SearchInput value={params.q ?? ""} onChange={(q) => setParams({ q })} placeholder="Search title or text…" label="Search notes" />}
        empty={
          params.q ? (
            <EmptyState plain title={`No notes match "${params.q}"`} description="Try a shorter search." />
          ) : (
            <EmptyState
              plain
              icon={<NotebookPen aria-hidden />}
              title="No notes yet"
              description="Write down site decisions, measurements or useful links so the whole team can find them."
              action={
                canWrite ? (
                  <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
                    New note
                  </Button>
                ) : undefined
              }
            />
          )
        }
      />
      {editing && (
        <NoteDrawer
          note={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void invalidate();
          }}
        />
      )}
    </div>
  );
}

function NoteDrawer({ note, onClose, onSaved }: { note: Note | null; onClose: () => void; onSaved: () => void }) {
  const site = useSite();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: note?.title ?? "", body: note?.body ?? "", link: note?.link ?? "" },
  });
  const save = useMutation({
    mutationFn: (v: NoteForm) => {
      const body = { title: v.title.trim(), body: v.body.trim(), link: v.link.trim() };
      return note ? api.patch<Note>(`${site.base}/notes/${note.id}`, body) : api.post<Note>(`${site.base}/notes`, body);
    },
    onSuccess: (n) => {
      notify.success(note ? "Note saved." : `"${n.title}" added.`);
      onSaved();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, ["title", "body", "link"])),
  });
  const { errors } = form.formState;
  return (
    <Drawer
      open
      onClose={onClose}
      title={note ? "Edit note" : "New note"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="note-form" loading={save.isPending}>
            {note ? "Save changes" : "Add note"}
          </Button>
        </>
      }
    >
      <form
        id="note-form"
        className="ce-stack"
        noValidate
        onSubmit={form.handleSubmit((v) => {
          setFormError(null);
          save.mutate(v);
        })}
      >
        <FormError message={formError} />
        <Field label="Title" required error={errors.title?.message}>
          <Input autoComplete="off" {...form.register("title")} />
        </Field>
        <Field label="Note" error={errors.body?.message}>
          <Textarea rows={10} {...form.register("body")} />
        </Field>
        <Field label="Link" hint="Optional — a drawing, document or map (https://…)" error={errors.link?.message}>
          <Input type="url" inputMode="url" placeholder="https://" autoComplete="off" {...form.register("link")} />
        </Field>
      </form>
    </Drawer>
  );
}

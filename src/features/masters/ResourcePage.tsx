import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Controller, useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import type { List, ImportResult, JobRef } from "@/lib/api/types";
import { useListParams, applyFieldErrors, useExportJob } from "@/lib/hooks";
import {
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FileImport,
  FormError,
  IconButton,
  Input,
  MoneyInput,
  PageHeader,
  SearchInput,
  Select,
  Textarea,
  notify,
  useConfirm,
  type ColumnDef,
} from "@/ui";
import { useSite, type SiteContextValue } from "@/app/site";

export interface FieldSpec<F> {
  name: Path<F> & string;
  label: string;
  type?: "text" | "tel" | "email" | "money" | "select" | "textarea" | "number";
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** span the full form width */
  wide?: boolean;
}

/**
 * Everything a master-data screen needs. One config per resource replaces a hand-built page.
 * T = API item, F = form values.
 */
export interface ResourceConfig<T extends { id: string }, F extends FieldValues> {
  title: string;
  singular: string;
  description?: string;
  /** react-query key prefix; the list params are appended */
  queryKey: (s: SiteContextValue) => unknown[];
  list: (s: SiteContextValue, params: Record<string, unknown>) => Promise<List<T>>;
  columns: ColumnDef<T, unknown>[];
  defaultSort?: string;
  searchPlaceholder?: string;
  canWrite: (s: SiteContextValue) => boolean;
  form: {
    schema: z.ZodType<F, z.ZodTypeDef, unknown>;
    defaults: DefaultValues<F>;
    fields: FieldSpec<F>[];
    fromItem: (item: T) => DefaultValues<F>;
  };
  create: (s: SiteContextValue, values: F) => Promise<T>;
  update: (s: SiteContextValue, id: string, values: F) => Promise<T>;
  remove?: {
    label: string;
    confirmTitle: (item: T) => string;
    confirmMessage: string;
    run: (s: SiteContextValue, item: T) => Promise<unknown>;
  };
  import?: {
    upload: (s: SiteContextValue, file: File, dryRun: boolean) => Promise<ImportResult>;
    template: (s: SiteContextValue) => Promise<void>;
    describe: string;
  };
  export?: (s: SiteContextValue) => Promise<JobRef>;
  emptyDescription: string;
}

export function ResourcePage<T extends { id: string }, F extends FieldValues>({ config }: { config: ResourceConfig<T, F> }) {
  const site = useSite();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [params, setParams] = useListParams({ sort: config.defaultSort });
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const canWrite = config.canWrite(site);

  const key = [...config.queryKey(site), params];
  const query = useQuery({ queryKey: key, queryFn: () => config.list(site, params), placeholderData: keepPreviousData });
  const invalidate = () => qc.invalidateQueries({ queryKey: config.queryKey(site) });

  const exportJob = useExportJob(() => config.export!(site), `${config.title} export`);
  const remove = useMutation({
    mutationFn: (item: T) => config.remove!.run(site, item),
    onSuccess: () => {
      notify.success(`${config.singular} removed.`);
      void invalidate();
    },
    onError: (e) => notify.error(e),
  });

  const columns = useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!canWrite) return config.columns;
    return [
      ...config.columns,
      {
        id: "actions",
        header: () => <span className="ce-visually-hidden">Actions</span>,
        size: 88,
        cell: ({ row }) => (
          <div className="ce-row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
            <IconButton size="sm" label={`Edit ${config.singular.toLowerCase()}`} icon={<Pencil />} onClick={() => setEditing(row.original)} />
            {config.remove && (
              <IconButton
                size="sm"
                label={config.remove.label}
                icon={<Trash2 />}
                onClick={async () => {
                  const ok = await confirm({
                    title: config.remove!.confirmTitle(row.original),
                    message: config.remove!.confirmMessage,
                    confirmLabel: config.remove!.label,
                    tone: "danger",
                  });
                  if (ok) remove.mutate(row.original);
                }}
              />
            )}
          </div>
        ),
      },
    ];
  }, [canWrite, config, confirm, remove]);

  return (
    <div className="ce-page">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            {config.export && (
              <Button icon={<Download />} loading={exportJob.isPending} onClick={() => exportJob.mutate()}>
                Export
              </Button>
            )}
            {canWrite && config.import && (
              <Button icon={<Upload />} onClick={() => setImporting(true)}>
                Import
              </Button>
            )}
            {canWrite && (
              <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
                Add {config.singular.toLowerCase()}
              </Button>
            )}
          </>
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
        toolbar={
          <SearchInput value={params.q ?? ""} onChange={(q) => setParams({ q })} placeholder={config.searchPlaceholder} label={`Search ${config.title.toLowerCase()}`} />
        }
        empty={
          params.q ? (
            <EmptyState plain title={`No ${config.title.toLowerCase()} match "${params.q}"`} description="Try a shorter search." />
          ) : (
            <EmptyState
              plain
              title={`No ${config.title.toLowerCase()} yet`}
              description={config.emptyDescription}
              action={
                canWrite ? (
                  <Button variant="primary" icon={<Plus />} onClick={() => setEditing("new")}>
                    Add {config.singular.toLowerCase()}
                  </Button>
                ) : undefined
              }
            />
          )
        }
      />
      {editing && (
        <ResourceForm
          config={config}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void invalidate();
          }}
        />
      )}
      {config.import && (
        <FileImport
          open={importing}
          onClose={() => setImporting(false)}
          title={`Import ${config.title.toLowerCase()}`}
          describe={config.import.describe}
          upload={(file, dryRun) => config.import!.upload(site, file, dryRun)}
          onTemplate={() => void config.import!.template(site).catch(notify.error)}
          onImported={() => void invalidate()}
        />
      )}
    </div>
  );
}

function ResourceForm<T extends { id: string }, F extends FieldValues>({
  config,
  item,
  onClose,
  onSaved,
}: {
  config: ResourceConfig<T, F>;
  item: T | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const site = useSite();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<F>({
    resolver: zodResolver(config.form.schema),
    defaultValues: item ? config.form.fromItem(item) : config.form.defaults,
  });
  const save = useMutation({
    mutationFn: (values: F) => (item ? config.update(site, item.id, values) : config.create(site, values)),
    onSuccess: () => {
      notify.success(item ? `${config.singular} updated.` : `${config.singular} added.`);
      onSaved();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, config.form.fields.map((f) => f.name))),
  });
  const formId = `resource-form-${config.singular}`;
  return (
    <Drawer
      open
      onClose={onClose}
      title={item ? `Edit ${config.singular.toLowerCase()}` : `Add ${config.singular.toLowerCase()}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={save.isPending}>
            {item ? "Save changes" : `Add ${config.singular.toLowerCase()}`}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="ce-stack"
        noValidate
        onSubmit={form.handleSubmit((v) => {
          setFormError(null);
          save.mutate(v);
        })}
      >
        <FormError message={formError} />
        {config.form.fields.map((f) => (
          <Controller
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field, fieldState }) => (
              <Field label={f.label} required={f.required} hint={f.hint} error={fieldState.error?.message}>
                {f.type === "money" ? (
                  <MoneyInput value={field.value as number | null} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                ) : f.type === "select" ? (
                  <Select {...field} value={(field.value as string) ?? ""} options={f.options ?? []} placeholder={f.placeholder ?? "Choose…"} />
                ) : f.type === "textarea" ? (
                  <Textarea {...field} value={(field.value as string) ?? ""} placeholder={f.placeholder} />
                ) : (
                  <Input
                    {...field}
                    value={(field.value as string) ?? ""}
                    type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : "text"}
                    inputMode={f.type === "tel" ? "numeric" : undefined}
                    placeholder={f.placeholder}
                    autoComplete="off"
                  />
                )}
              </Field>
            )}
          />
        ))}
      </form>
    </Drawer>
  );
}

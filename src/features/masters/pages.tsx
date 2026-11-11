import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Plus, UserMinus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { JobRef, List, Member, SiteRole } from "@/lib/api/types";
import { applyFieldErrors, useExportJob } from "@/lib/hooks";
import { useSite } from "@/app/site";
import { useAuth } from "@/app/auth";
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
  Select,
  StatusBadge,
  notify,
  useConfirm,
} from "@/ui";
import { ResourcePage } from "./ResourcePage";
import { clientsResource, labourResource, productsResource, vendorsResource } from "./resources";

export const VendorsPage = () => <ResourcePage config={vendorsResource} />;
export const ClientsPage = () => <ResourcePage config={clientsResource} />;
export const LabourPage = () => <ResourcePage config={labourResource} />;
export const ProductsPage = () => <ResourcePage config={productsResource} />;

const ROLE_OPTIONS = [
  { value: "engineer", label: "Engineer" },
  { value: "supervisor", label: "Supervisor" },
];

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number")),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use letters and numbers"),
  role: z.enum(["engineer", "supervisor"]),
});
type MemberForm = z.input<typeof memberSchema>;

/** Site team: who can sign in and what they can do here. */
export function TeamPage() {
  const site = useSite();
  const { session } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const canManage = site.can("site:manage");
  const key = ["members", site.site.id];
  const query = useQuery({ queryKey: key, queryFn: () => api.get<List<Member>>(`${site.base}/members`) });
  const exportJob = useExportJob(() => api.post<JobRef>(`${site.base}/exports`, { entity: "team" }), "Team export");

  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: SiteRole }) => api.put(`${site.base}/members/${userId}`, { role }),
    onSuccess: () => {
      notify.success("Role updated.");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: notify.error,
  });
  const remove = useMutation({
    mutationFn: (userId: string) => api.delete(`${site.base}/members/${userId}`),
    onSuccess: () => {
      notify.success("Removed from site.");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: notify.error,
  });

  return (
    <div className="ce-page">
      <PageHeader
        title="Team"
        description="Engineers manage the site. Supervisors mark attendance, receive goods and keep the worklog. Organisation admins can see every site."
        actions={
          <>
            <Button icon={<Download />} loading={exportJob.isPending} onClick={() => exportJob.mutate()}>
              Export
            </Button>
            {canManage && (
              <Button variant="primary" icon={<Plus />} onClick={() => setAdding(true)}>
                Add person
              </Button>
            )}
          </>
        }
      />
      <DataTable<Member>
        data={query.data?.items}
        rowKey={(m) => m.userId}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={<EmptyState plain title="Nobody added yet" description="Add the engineers and supervisors who work on this site." />}
        columns={[
          { accessorKey: "name", header: "Name", cell: ({ row }) => <strong>{row.original.name}</strong> },
          { accessorKey: "email", header: "Email", meta: { hideBelow: 700 } },
          { accessorKey: "phone", header: "Phone", meta: { hideBelow: 900 }, cell: ({ row }) => <span className="ce-num">{row.original.phone}</span> },
          {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) =>
              canManage && row.original.userId !== session?.user.id ? (
                <Select
                  aria-label={`Role for ${row.original.name}`}
                  value={row.original.role}
                  options={ROLE_OPTIONS}
                  onChange={(e) => setRole.mutate({ userId: row.original.userId, role: e.target.value as SiteRole })}
                  style={{ maxWidth: 150 }}
                />
              ) : (
                ROLE_OPTIONS.find((o) => o.value === row.original.role)?.label
              ),
          },
          { accessorKey: "status", header: "Account", meta: { hideBelow: 700 }, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
          ...(canManage
            ? [
                {
                  id: "actions",
                  header: () => <span className="ce-visually-hidden">Actions</span>,
                  cell: ({ row }: { row: { original: Member } }) =>
                    row.original.userId === session?.user.id ? null : (
                      <IconButton
                        size="sm"
                        label={`Remove ${row.original.name} from site`}
                        icon={<UserMinus />}
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Remove ${row.original.name} from this site?`,
                            message: "They lose access to this site immediately. Their past entries stay.",
                            confirmLabel: "Remove",
                            tone: "danger",
                          });
                          if (ok) remove.mutate(row.original.userId);
                        }}
                      />
                    ),
                },
              ]
            : []),
        ]}
      />
      {adding && <AddMemberDrawer onClose={() => setAdding(false)} onSaved={() => void qc.invalidateQueries({ queryKey: key })} />}
    </div>
  );
}

function AddMemberDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const site = useSite();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", role: "supervisor" },
  });
  const save = useMutation({
    mutationFn: (v: MemberForm) => api.post(`${site.base}/members`, memberSchema.parse(v)),
    onSuccess: () => {
      notify.success("Person added. Share their email and password with them.");
      onSaved();
      onClose();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, ["name", "email", "phone", "password", "role"])),
  });
  const text = (name: keyof MemberForm, label: string, type = "text", hint?: string) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field label={label} required hint={hint} error={fieldState.error?.message}>
          <Input {...field} type={type} autoComplete={type === "password" ? "new-password" : "off"} />
        </Field>
      )}
    />
  );
  return (
    <Drawer
      open
      onClose={onClose}
      title="Add person to site"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="member-form" loading={save.isPending}>
            Add person
          </Button>
        </>
      }
    >
      <form id="member-form" className="ce-stack" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <FormError message={formError} />
        {text("name", "Name")}
        {text("email", "Email", "email", "They sign in with this")}
        {text("phone", "Phone", "tel")}
        {text("password", "Temporary password", "password", "At least 8 characters with letters and numbers. They can change it after signing in.")}
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <Field label="Role" required>
              <Select {...field} options={ROLE_OPTIONS} />
            </Field>
          )}
        />
      </form>
    </Drawer>
  );
}

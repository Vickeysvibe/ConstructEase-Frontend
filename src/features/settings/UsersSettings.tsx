import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Plus, UserCheck, UserX } from "lucide-react";
import { api } from "@/lib/api/client";
import type { List, OrgRole, User } from "@/lib/api/types";
import { applyFieldErrors, useListParams } from "@/lib/hooks";
import { useAuth } from "@/app/auth";
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FormError,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Select,
  StatusBadge,
  notify,
  useConfirm,
  type ColumnDef,
} from "@/ui";

const ROLE_LABEL: Record<OrgRole, string> = { owner: "Owner", admin: "Admin", member: "Member" };
const ROLE_HELP = "Owners and admins manage the organisation and see every site. Members see only the sites they are added to.";
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use letters and numbers");

/** Organisation users: who can sign in, and their org role. Site roles live on each site's Team page. */
export default function UsersSettings() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [params, setParams] = useListParams<{ status: string }>({ pageSize: 25 });
  const [adding, setAdding] = useState(false);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const iAmOwner = session?.user.orgRole === "owner";
  const roleOptions = (["member", "admin", ...(iAmOwner ? ["owner"] : [])] as OrgRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }));

  const query = useQuery({
    queryKey: ["users", params],
    queryFn: ({ signal }) => api.get<List<User>>("/users", params, signal),
    placeholderData: keepPreviousData,
  });
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["users"] });

  const update = useMutation({
    mutationFn: ({ user, patch }: { user: User; patch: Partial<Pick<User, "orgRole" | "status">> }) => api.patch<User>(`/users/${user.id}`, patch),
    onSuccess: (u, { patch }) => {
      notify.success(patch.status ? `${u.name} ${u.status === "active" ? "enabled" : "disabled"}.` : `${u.name} is now ${ROLE_LABEL[u.orgRole].toLowerCase()}.`);
      invalidate();
    },
    // e.g. "An organisation needs at least one active owner."
    onError: (err) => {
      notify.error(err);
      invalidate();
    },
  });

  const changeRole = async (user: User, orgRole: OrgRole) => {
    const ok = await confirm({
      title: `Make ${user.name} ${ROLE_LABEL[orgRole].toLowerCase()}?`,
      message: orgRole === "member" ? "They will only see the sites they are added to." : "They will manage the organisation and see every site.",
      confirmLabel: "Change role",
    });
    if (ok) update.mutate({ user, patch: { orgRole } });
  };
  const toggleStatus = async (user: User) => {
    const disabling = user.status === "active";
    const ok = await confirm({
      title: disabling ? `Disable ${user.name}?` : `Enable ${user.name}?`,
      message: disabling ? "They are signed out everywhere and can't sign in. Their past entries stay." : "They can sign in again with their existing password.",
      confirmLabel: disabling ? "Disable" : "Enable",
      tone: disabling ? "danger" : "primary",
    });
    if (ok) update.mutate({ user, patch: { status: disabling ? "disabled" : "active" } });
  };

  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      meta: { sortKey: "name" },
      cell: ({ row }) => (
        <>
          <strong>{row.original.name}</strong>
          {row.original.id === session?.user.id && (
            <>
              {" "}
              <Badge tone="info">You</Badge>
            </>
          )}
        </>
      ),
    },
    { accessorKey: "email", header: "Email", meta: { sortKey: "email", hideBelow: 700 } },
    { accessorKey: "phone", header: "Phone", meta: { hideBelow: 1000 }, cell: ({ row }) => <span className="ce-num">{row.original.phone}</span> },
    {
      accessorKey: "orgRole",
      header: "Role",
      cell: ({ row }) => {
        const u = row.original;
        const editable = u.id !== session?.user.id && (iAmOwner || u.orgRole !== "owner");
        return editable ? (
          <Select
            aria-label={`Role for ${u.name}`}
            value={u.orgRole}
            options={roleOptions}
            disabled={update.isPending}
            onChange={(e) => void changeRole(u, e.target.value as OrgRole)}
            style={{ maxWidth: 140 }}
          />
        ) : (
          ROLE_LABEL[u.orgRole]
        );
      },
    },
    { accessorKey: "status", header: "Status", meta: { hideBelow: 600 }, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: () => <span className="ce-visually-hidden">Actions</span>,
      cell: ({ row }) => {
        const u = row.original;
        if (u.id === session?.user.id) return null;
        const canTouch = iAmOwner || u.orgRole !== "owner";
        if (!canTouch) return null;
        return (
          <div className="ce-row" style={{ flexWrap: "nowrap", justifyContent: "flex-end" }}>
            <IconButton size="sm" label={`Reset password for ${u.name}`} icon={<KeyRound />} onClick={() => setResetFor(u)} />
            <IconButton
              size="sm"
              label={u.status === "active" ? `Disable ${u.name}` : `Enable ${u.name}`}
              icon={u.status === "active" ? <UserX /> : <UserCheck />}
              onClick={() => void toggleStatus(u)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="ce-stack">
      <p className="settings-note">
        {ROLE_HELP} Site roles (engineer or supervisor) are managed on each site's Team page.
      </p>
      <DataTable<User>
        caption="Organisation users"
        data={query.data?.items}
        rowKey={(u) => u.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={params.page}
        pageSize={params.pageSize}
        total={query.data?.total}
        onPageChange={(page) => setParams({ page })}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        columns={columns}
        toolbar={
          <>
            <div className="ce-table-toolbar__left">
              <SearchInput value={params.q ?? ""} onChange={(q) => setParams({ q })} placeholder="Search name or email…" />
              <Select
                aria-label="Status"
                value={params.status ?? ""}
                placeholder="All statuses"
                options={STATUS_OPTIONS}
                onChange={(e) => setParams({ status: e.target.value || undefined })}
                style={{ maxWidth: 160 }}
              />
            </div>
            <div className="ce-table-toolbar__right">
              <Button variant="primary" icon={<Plus />} onClick={() => setAdding(true)}>
                Add user
              </Button>
            </div>
          </>
        }
        empty={
          params.q || params.status ? (
            <EmptyState plain title="No users match" description="Try a different search or status." />
          ) : (
            <EmptyState plain title="No users yet" description="Add the people who should sign in to ConstructEase." />
          )
        }
      />
      {adding && <AddUserDrawer roleOptions={roleOptions} onClose={() => setAdding(false)} onSaved={invalidate} />}
      {resetFor && <ResetPasswordModal user={resetFor} onClose={() => setResetFor(null)} />}
    </div>
  );
}

const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, "").replace(/^\+91/, ""))
    .pipe(z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number")),
  password,
  orgRole: z.enum(["owner", "admin", "member"]),
});
type UserForm = z.input<typeof userSchema>;

function AddUserDrawer({ roleOptions, onClose, onSaved }: { roleOptions: { value: string; label: string }[]; onClose: () => void; onSaved: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", orgRole: "member" },
  });
  const { errors } = form.formState;
  const save = useMutation({
    mutationFn: (v: UserForm) => api.post<User>("/users", userSchema.parse(v)),
    onSuccess: (u) => {
      notify.success(`${u.name} added. Share their email and temporary password with them.`);
      onSaved();
      onClose();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, Object.keys(userSchema.shape))),
  });
  return (
    <Drawer
      open
      onClose={onClose}
      title="Add user"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="user-form" loading={save.isPending}>
            Add user
          </Button>
        </>
      }
    >
      <form id="user-form" className="ce-stack" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <FormError message={formError} />
        <Field label="Name" required error={errors.name?.message}>
          <Input autoComplete="off" {...form.register("name")} />
        </Field>
        <Field label="Email" required hint="They sign in with this" error={errors.email?.message}>
          <Input type="email" autoComplete="off" {...form.register("email")} />
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          <Input type="tel" {...form.register("phone")} />
        </Field>
        <Field label="Temporary password" required hint="At least 8 characters with letters and numbers. They can change it after signing in." error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Organisation role" required hint={ROLE_HELP} error={errors.orgRole?.message}>
          <Select options={roleOptions} {...form.register("orgRole")} />
        </Field>
        <p className="settings-note">To give a member access to a site, add them on that site's Team page.</p>
      </form>
    </Drawer>
  );
}

const resetSchema = z.object({ newPassword: password });
type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { newPassword: "" } });
  const save = useMutation({
    mutationFn: (v: ResetForm) => api.post<void>(`/users/${user.id}/reset-password`, v),
    onSuccess: () => {
      notify.success(`Password reset for ${user.name}. They have been signed out everywhere.`);
      onClose();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, ["newPassword"])),
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Reset password for ${user.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="reset-form" loading={save.isPending}>
            Reset password
          </Button>
        </>
      }
    >
      <form id="reset-form" className="ce-stack" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <FormError message={formError} />
        <Field label="New password" required hint="Share it with them; they can change it after signing in." error={form.formState.errors.newPassword?.message}>
          <Input type="password" autoComplete="new-password" data-autofocus {...form.register("newPassword")} />
        </Field>
      </form>
    </Modal>
  );
}

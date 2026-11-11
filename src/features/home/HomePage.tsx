import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { OrgDashboard, Site } from "@/lib/api/types";
import { moneyShort } from "@/lib/format";
import { applyFieldErrors } from "@/lib/hooks";
import { useAuth, meQueryKey } from "@/app/auth";
import { Badge, Button, Card, Drawer, EmptyState, Field, FormError, Input, LoadingBlock, PageHeader, Textarea, notify } from "@/ui";
import "./home.css";

/** Landing page: the sites you can open, with today's headline numbers. */
export default function HomePage() {
  const { me, isOrgAdmin, session } = useAuth();
  const [creating, setCreating] = useState(false);
  const dash = useQuery({ queryKey: ["dashboard", "org"], queryFn: () => api.get<OrgDashboard>("/dashboard"), retry: false });
  const stats = new Map(dash.data?.sites.map((s) => [s.id, s]) ?? []);

  if (!me) return <LoadingBlock rows={4} />;
  const sites = [...me.sites].sort((a, b) => Number(a.status === "archived") - Number(b.status === "archived") || a.name.localeCompare(b.name));

  return (
    <div className="ce-page">
      <PageHeader
        title="Your sites"
        crumbs={session?.org.name}
        actions={
          isOrgAdmin && (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              New site
            </Button>
          )
        }
      />
      {sites.length === 0 ? (
        <EmptyState
          icon={<Building aria-hidden />}
          title={isOrgAdmin ? "Create your first site" : "You haven't been added to a site yet"}
          description={isOrgAdmin ? "Each site keeps its own purchase orders, stock, attendance and payments." : "Ask your engineer or organisation admin to add you to a site."}
          action={
            isOrgAdmin ? (
              <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
                New site
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="site-grid">
          {sites.map((s) => {
            const st = stats.get(s.id);
            return (
              <Link key={s.id} to={`/sites/${s.id}`} className="site-card">
                <div className="site-card__head">
                  <h2>{s.name}</h2>
                  {s.status === "archived" ? <Badge>Archived</Badge> : <Badge tone="info">{s.role === "engineer" ? "Engineer" : "Supervisor"}</Badge>}
                </div>
                <dl className="site-card__stats">
                  <div>
                    <dt>Labour today</dt>
                    <dd className="ce-num">{st ? st.today.labourPresent : "—"}</dd>
                  </div>
                  <div>
                    <dt>Open POs</dt>
                    <dd className="ce-num">{st ? st.openPOs : "—"}</dd>
                  </div>
                  {st?.monthSpendPaise !== undefined && (
                    <div>
                      <dt>Spend this month</dt>
                      <dd className="ce-num">{moneyShort(st.monthSpendPaise)}</dd>
                    </div>
                  )}
                </dl>
              </Link>
            );
          })}
        </div>
      )}
      {creating && <CreateSiteDrawer onClose={() => setCreating(false)} />}
    </div>
  );
}

const siteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  address: z.string().trim().min(1, "Address is required").max(500),
});
type SiteForm = z.infer<typeof siteSchema>;

function CreateSiteDrawer({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SiteForm>({ resolver: zodResolver(siteSchema), defaultValues: { name: "", address: "" } });
  const save = useMutation({
    mutationFn: (v: SiteForm) => api.post<Site>("/sites", v),
    onSuccess: (s) => {
      notify.success(`${s.name} created.`);
      void qc.invalidateQueries({ queryKey: meQueryKey });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, ["name", "address"])),
  });
  return (
    <Drawer
      open
      onClose={onClose}
      title="New site"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="site-form" loading={save.isPending}>
            Create site
          </Button>
        </>
      }
    >
      <form id="site-form" className="ce-stack" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <FormError message={formError} />
        <Field label="Site name" required error={form.formState.errors.name?.message}>
          <Input placeholder="Lakshmi Residency, Anna Nagar" {...form.register("name")} />
        </Field>
        <Field label="Address" required error={form.formState.errors.address?.message}>
          <Textarea {...form.register("address")} />
        </Field>
        <Card>
          <p className="ce-muted">The site starts with a To-do and a Work done tracker. Add vendors, labour and your team from the Masters section.</p>
        </Card>
      </form>
    </Drawer>
  );
}

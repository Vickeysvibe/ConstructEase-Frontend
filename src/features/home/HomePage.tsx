import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Building, CalendarCheck, Plus, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api/client";
import type { List, MeSite, OrgDashboard, Site } from "@/lib/api/types";
import { moneyShort } from "@/lib/format";
import { applyFieldErrors } from "@/lib/hooks";
import { useAuth, meQueryKey } from "@/app/auth";
import { Badge, Button, Card, Drawer, EmptyState, Field, FormError, Input, LoadingBlock, PageHeader, Textarea, notify } from "@/ui";
import "./home.css";

/** Landing page: the sites you can open, with today's headline numbers. */
export default function HomePage() {
  const { me, isOrgAdmin } = useAuth();
  const [creating, setCreating] = useState(false);
  const dash = useQuery({ queryKey: ["dashboard", "org"], queryFn: () => api.get<OrgDashboard>("/dashboard"), retry: false });
  const stats = new Map(dash.data?.sites.map((s) => [s.id, s]) ?? []);
  const siteList = useQuery({ queryKey: ["sites", "all"], queryFn: () => api.get<List<Site>>("/sites", { pageSize: 100 }) });
  const addresses = new Map(siteList.data?.items.map((s) => [s.id, s.address]) ?? []);

  if (!me) return <LoadingBlock rows={4} />;
  const sites = [...me.sites].sort((a, b) => Number(a.status === "archived") - Number(b.status === "archived") || a.name.localeCompare(b.name));

  return (
    <div className="ce-page">
      <PageHeader
        title="Your sites"
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
          {sites.map((s) => (
            <SiteCard
              key={s.id}
              site={s}
              address={addresses.get(s.id)}
              stats={stats.get(s.id)}
              isOrgAdmin={isOrgAdmin}
            />
          ))}
          {isOrgAdmin && (
            <button type="button" className="site-card site-card--new" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              <span>New site</span>
              <small>Start tracking another project</small>
            </button>
          )}
        </div>
      )}
      {creating && <CreateSiteDrawer onClose={() => setCreating(false)} />}
    </div>
  );
}

type SiteStats = OrgDashboard["sites"][number];

function initials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** One site: identity on top, today's numbers in the middle, the two most common jobs at the bottom. */
function SiteCard({ site, address, stats, isOrgAdmin }: { site: MeSite; address?: string; stats?: SiteStats; isOrgAdmin: boolean }) {
  const base = `/sites/${site.id}`;
  const archived = site.status === "archived";
  return (
    <article className={`site-card${archived ? " site-card--archived" : ""}`}>
      <div className="site-card__head">
        <span className="site-card__mark" aria-hidden>
          {initials(site.name)}
        </span>
        <div className="site-card__titles">
          <h2>
            <Link to={base} className="site-card__link">
              {site.name}
            </Link>
          </h2>
          {address && <p className="site-card__address">{address}</p>}
        </div>
        {archived ? (
          <Badge>Archived</Badge>
        ) : (
          <Badge tone="info">{isOrgAdmin ? "Admin" : site.role === "engineer" ? "Engineer" : "Supervisor"}</Badge>
        )}
      </div>
      <dl className="site-card__stats">
        <div>
          <dt>Labour today</dt>
          <dd>{stats ? stats.today.labourPresent : "—"}</dd>
        </div>
        <div>
          <dt>Open orders</dt>
          <dd>{stats ? stats.openPOs : "—"}</dd>
        </div>
        <div>
          <dt>{stats?.monthSpendPaise !== undefined ? "Spend this month" : "Checked in"}</dt>
          <dd>{stats ? (stats.monthSpendPaise !== undefined ? moneyShort(stats.monthSpendPaise) : stats.today.checkedIn) : "—"}</dd>
        </div>
      </dl>
      <div className="site-card__foot">
        {!archived && (
          <>
            <Link to={`${base}/attendance`} className="site-card__quick">
              <CalendarCheck aria-hidden /> Attendance
            </Link>
            <Link to={`${base}/purchasing/orders`} className="site-card__quick">
              <ShoppingCart aria-hidden /> Orders
            </Link>
          </>
        )}
        <span className="ce-spacer" />
        <span className="site-card__open" aria-hidden>
          Open site <ArrowRight />
        </span>
      </div>
    </article>
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

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api/client";
import type { Org, OrgInput } from "@/lib/api/types";
import { applyFieldErrors } from "@/lib/hooks";
import { meQueryKey } from "@/app/auth";
import { Button, Card, ErrorState, Field, FormError, Input, LoadingBlock, Select, Textarea, notify } from "@/ui";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

const optional = (max: number) => z.string().trim().max(max);
const orgSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Enter a full link starting with https://"),
  description: optional(1000),
  address: optional(500),
  phone: optional(20),
  gstIn: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[0-9A-Z]{15}$/.test(v), "GSTIN has 15 letters and digits"),
  timezone: z.string().min(1, "Choose a timezone"),
});
type OrgForm = z.input<typeof orgSchema>;
const FIELDS = ["name", "logoUrl", "description", "address", "phone", "gstIn", "timezone"];

const toForm = (o: Org): OrgForm => ({
  name: o.name,
  logoUrl: o.logoUrl ?? "",
  description: o.description ?? "",
  address: o.address ?? "",
  phone: o.phone ?? "",
  gstIn: o.gstIn ?? "",
  timezone: o.timezone || "Asia/Kolkata",
});

/** Organisation profile: printed on purchase orders and used for business dates (timezone). */
export default function OrgSettings() {
  const query = useQuery({ queryKey: ["org"], queryFn: () => api.get<Org>("/org") });
  if (query.isPending) return <LoadingBlock rows={6} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return <OrgFormCard org={query.data} />;
}

function OrgFormCard({ org }: { org: Org }) {
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<OrgForm>({ resolver: zodResolver(orgSchema), defaultValues: toForm(org) });
  const { errors } = form.formState;
  const logoUrl = form.watch("logoUrl").trim();
  const [logoBroken, setLogoBroken] = useState(false);
  useEffect(() => setLogoBroken(false), [logoUrl]);

  const zones = TIMEZONES.includes(org.timezone) ? TIMEZONES : [org.timezone, ...TIMEZONES];

  const save = useMutation({
    mutationFn: (v: OrgForm) => api.patch<Org>("/org", orgSchema.parse(v) satisfies OrgInput),
    onSuccess: (saved) => {
      setFormError(null);
      qc.setQueryData(["org"], saved);
      void qc.invalidateQueries({ queryKey: meQueryKey });
      form.reset(toForm(saved));
      notify.success("Organisation details saved.");
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, FIELDS)),
  });

  return (
    <Card title="Organisation">
      <form className="ce-stack settings-form" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <FormError message={formError} />
        <Field label="Organisation name" required error={errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <div className="ce-row" style={{ alignItems: "flex-start" }}>
          <div className="settings-logo" aria-live="polite">
            {logoUrl && !logoBroken && !errors.logoUrl ? (
              <img src={logoUrl} alt="Logo preview" onError={() => setLogoBroken(true)} />
            ) : (
              <span>{logoUrl && logoBroken ? "Couldn't load this image" : "No logo"}</span>
            )}
          </div>
          <Field label="Logo URL" hint="A link to a PNG or JPG. It is printed on purchase orders." error={errors.logoUrl?.message} className="ce-spacer">
            <Input type="url" placeholder="https://…" {...form.register("logoUrl")} />
          </Field>
        </div>
        <Field label="Description" error={errors.description?.message}>
          <Textarea rows={3} {...form.register("description")} />
        </Field>
        <Field label="Address" error={errors.address?.message}>
          <Textarea rows={3} {...form.register("address")} />
        </Field>
        <div className="ce-form-grid">
          <Field label="Phone" error={errors.phone?.message}>
            <Input type="tel" {...form.register("phone")} />
          </Field>
          <Field label="GSTIN" error={errors.gstIn?.message}>
            <Input placeholder="33AABCS1429B1Z5" {...form.register("gstIn")} />
          </Field>
          <Field label="Timezone" required hint="Business dates (attendance, reports) follow this." error={errors.timezone?.message}>
            <Select options={zones.map((z) => ({ value: z, label: z.replace(/_/g, " ") }))} {...form.register("timezone")} />
          </Field>
        </div>
        <div className="ce-row">
          <Button type="submit" variant="primary" loading={save.isPending} disabled={!form.formState.isDirty}>
            Save changes
          </Button>
          {form.formState.isDirty && (
            <Button variant="ghost" onClick={() => form.reset(toForm(org))}>
              Discard
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { applyFieldErrors } from "@/lib/hooks";
import { useAuth } from "@/app/auth";
import { Button, Card, DescriptionList, Field, FormError, Input, PageHeader, notify } from "@/ui";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use letters and numbers"),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type Form = z.infer<typeof schema>;

export default function AccountPage() {
  const { session } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });
  const save = useMutation({
    mutationFn: (v: Form) => api.post("/auth/change-password", { currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      notify.success("Password changed. Other devices have been signed out.");
      form.reset();
    },
    onError: (err) => setFormError(applyFieldErrors(err, form.setError, ["currentPassword", "newPassword"])),
  });
  return (
    <div className="ce-page" style={{ maxWidth: 640 }}>
      <PageHeader title="Your account" />
      <Card title="Profile">
        <DescriptionList
          items={[
            { label: "Name", value: session?.user.name },
            { label: "Email", value: session?.user.email },
            { label: "Organisation", value: session?.org.name },
          ]}
        />
      </Card>
      <Card title="Change password">
        <form className="ce-stack" noValidate onSubmit={form.handleSubmit((v) => (setFormError(null), save.mutate(v)))}>
          <FormError message={formError} />
          <Field label="Current password" error={form.formState.errors.currentPassword?.message}>
            <Input type="password" autoComplete="current-password" {...form.register("currentPassword")} />
          </Field>
          <Field label="New password" hint="At least 8 characters with letters and numbers." error={form.formState.errors.newPassword?.message}>
            <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
          </Field>
          <Field label="Repeat new password" error={form.formState.errors.confirm?.message}>
            <Input type="password" autoComplete="new-password" {...form.register("confirm")} />
          </Field>
          <div className="ce-form-actions">
            <Button type="submit" variant="primary" loading={save.isPending}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

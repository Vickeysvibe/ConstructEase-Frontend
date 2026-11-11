import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logo from "@/assets/logo.png";
import { useAuth } from "@/app/auth";
import { Button, Field, FormError, Input, errorMessage } from "@/ui";
import "./login.css";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type Form = z.infer<typeof schema>;

/** Only same-app paths are allowed as a post-login redirect (no open redirects). */
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

export default function LoginPage() {
  const { status, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  if (status === "authenticated") return <Navigate to={safeNext(params.get("next"))} replace />;

  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await login(v.email, v.password);
      navigate(safeNext(params.get("next")), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <img src={logo} alt="" width={40} height={40} />
          <span>ConstructEase</span>
        </div>
        <h1>Sign in</h1>
        <p className="ce-muted">Purchase orders, stock, attendance and payments for every site, in one place.</p>
        <form className="ce-stack" onSubmit={onSubmit} noValidate>
          <FormError message={error} />
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" autoComplete="username" autoFocus {...form.register("email")} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...form.register("password")} />
          </Field>
          <Button type="submit" variant="primary" block loading={form.formState.isSubmitting}>
            Sign in
          </Button>
        </form>
        <p className="ce-muted login__help">Forgot your password? Ask your organisation admin to reset it.</p>
      </div>
      <div className="login__art" aria-hidden />
    </div>
  );
}

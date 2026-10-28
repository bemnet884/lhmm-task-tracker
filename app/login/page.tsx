import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Logo />
      <LoginForm />
    </main>
  );
}
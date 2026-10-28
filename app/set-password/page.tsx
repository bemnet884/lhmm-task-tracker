import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <SetPasswordForm token={token} />
    </main>
  );
}
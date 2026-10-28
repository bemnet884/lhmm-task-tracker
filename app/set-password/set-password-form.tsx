"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { PasswordInput } from "@/components/password-input";

export function SetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This invite link is missing or broken. Ask your admin for a new one.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "This link is invalid or has expired");
      return;
    }
    toast.success("Password set. You can sign in now.");
    router.push("/login");
  }

  return (
    <Card className="w-full max-w-sm min-h-dvh flex-col gap-6">
      <CardHeader>
        <CardTitle>Set your password</CardTitle>
        <CardDescription>Choose a password (at least 8 characters)</CardDescription>
      </CardHeader>
      <CardContent>
        <Logo />
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput id="password" name="password" minLength={8} required />

          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput id="confirm" name="confirm" minLength={8} required />          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
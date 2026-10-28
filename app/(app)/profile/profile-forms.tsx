"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";
import { SignOutButton } from "../sign-out-button";
import { InstallApp } from "@/components/install-app";
import { PasswordInput } from "@/components/password-input";
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t py-8 md:grid-cols-3">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  );
}

export function ProfileForms({
  name: initialName,
  email,
  phone: initialPhone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [savingPassword, setSavingPassword] = useState(false);

  const dirty =
    name.trim() !== initialName || phone.trim() !== initialPhone;

  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({ name, phone });
      if (!res.ok) toast.error(res.error);
      else toast.success("Profile saved");
    });
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const newPassword = String(f.get("newPassword"));
    if (newPassword !== String(f.get("confirm"))) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    const { error } = await authClient.changePassword({
      currentPassword: String(f.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message ?? "Could not change the password");
      return;
    }
    form.reset();
    toast.success("Password updated");
  }

  return (
    <>
      <Section
        title="Personal information"
        description="Your name is shown to the team. Your phone number will be used for WhatsApp notifications."
      >
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Ask an admin if your email needs to change.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 9..."
              inputMode="tel"
            />
            <p className="text-xs text-muted-foreground">
              Include the country code.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!dirty || pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Section>

      <Section
        title="Password"
        description="Use at least 8 characters. Changing it signs you out of other devices."
      >
        <form onSubmit={savePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <PasswordInput
                id="confirm"
                name="confirm"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </Section>
      <div className="md:hidden">
        <Section title="Session" description="Sign out of this device.">
          <SignOutButton />
        </Section>
      </div>
      <Section
        title="Install app"
        description="Add the tracker to your home screen for one-tap access."
      >
        <InstallApp />
      </Section>
    </>
  );
}
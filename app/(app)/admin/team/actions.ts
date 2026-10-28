"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Result = { ok: true; inviteLink?: string } | { ok: false; error: string };

const memberSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  phone: z.string().trim().optional(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

// Uses Better Auth's reset-password flow to mint a token. Our sendResetPassword
// hook (lib/auth.ts) saves it on the user, so we read it back here.
async function createInviteLink(userId: string, email: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { inviteToken: null },
  });
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/set-password" },
  });

  // The hook may finish slightly after the call returns, so wait briefly for it
  for (let i = 0; i < 10; i++) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { inviteToken: true },
    });
    if (u?.inviteToken) {
      return `${process.env.BETTER_AUTH_URL}/set-password?token=${u.inviteToken}`;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Could not generate the invite link");
}

export async function addMember(input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, email, phone, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { ok: false, error: "A member with this email already exists" };
  }

  const user = await prisma.user.create({
    data: { id: randomUUID(), name, email, phone: phone || null, role },
  });

  try {
    const inviteLink = await createInviteLink(user.id, email);
    revalidatePath("/admin/team");
    return { ok: true, inviteLink };
  } catch (e) {
    revalidatePath("/admin/team");
    return {
      ok: false,
      error:
        "Member created, but the invite link failed. Use 'Invite link' on their row.",
    };
  }
}

export async function updateMember(
  id: string,
  input: unknown
): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = memberSchema.omit({ email: true }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, phone, role } = parsed.data;

  if (id === admin.id && role !== "ADMIN") {
    return { ok: false, error: "You can't remove your own admin role" };
  }

  await prisma.user.update({
    where: { id },
    data: { name, phone: phone || null, role },
  });
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function setMemberActive(
  id: string,
  active: boolean
): Promise<Result> {
  const admin = await requireAdmin();
  if (id === admin.id) {
    return { ok: false, error: "You can't deactivate your own account" };
  }

  await prisma.user.update({ where: { id }, data: { active } });
  if (!active) {
    // kick them out immediately
    await prisma.session.deleteMany({ where: { userId: id } });
  }
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function regenerateInvite(id: string): Promise<Result> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { ok: false, error: "Member not found" };

  try {
    return {
      ok: true,
      inviteLink: await createInviteLink(user.id, user.email),
    };
  } catch {
    return { ok: false, error: "Could not generate the invite link" };
  }
}

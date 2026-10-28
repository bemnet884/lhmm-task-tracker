"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().trim().max(20, "Phone number is too long").optional(),
});

export async function updateProfile(
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL!;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      name: process.env.SEED_ADMIN_NAME!,
      email,
      emailVerified: true,
      role: "ADMIN",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(process.env.SEED_ADMIN_PASSWORD!),
        },
      },
    },
  });
  console.log("Admin created:", email);
}

main().finally(() => prisma.$disconnect());

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { TeamTable, type Member } from "./team-table";

export default async function TeamPage() {
  const me = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      accounts: { select: { id: true } },
      _count: {
        select: {
          assignments: { where: { task: { status: { not: "DONE" } } } },
        },
      },
    },
  });

  const members: Member[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role as "ADMIN" | "MEMBER",
    active: u.active,
    pending: u.accounts.length === 0,
    openTasks: u._count.assignments,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Add members, share their invite link, and manage roles.
        </p>
      </div>
      <TeamTable members={members} currentUserId={me.id} />
    </div>
  );
}
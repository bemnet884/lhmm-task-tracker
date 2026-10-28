import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { initials } from "@/lib/initials";
import { Badge } from "@/components/ui/badge";
import { ProfileForms } from "./profile-forms";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { name: true, email: true, phone: true, role: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-4 pb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
          {initials(user.name)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{user.name}</h1>
            <Badge variant="secondary">
              {user.role === "ADMIN" ? "Admin" : "Member"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <ProfileForms name={user.name} email={user.email} phone={user.phone ?? ""} />
    </div>
  );
}
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/native-select";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  addMember, updateMember, setMemberActive, regenerateInvite,
} from "./actions";

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "MEMBER";
  active: boolean;
  pending: boolean;
  openTasks: number;
};

export function TeamTable({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setFormOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name")),
      email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""),
      role: String(f.get("role")),
    };

    startTransition(async () => {
      const res = editing
        ? await updateMember(editing.id, data)
        : await addMember(data);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setFormOpen(false);
      if (editing) {
        toast.success("Member updated");
      } else {
        toast.success("Member added");
        if (res.inviteLink) setInviteLink(res.inviteLink);
      }
    });
  }

  function toggleActive(m: Member) {
    startTransition(async () => {
      const res = await setMemberActive(m.id, !m.active);
      if (!res.ok) toast.error(res.error);
      else toast.success(m.active ? "Member deactivated" : "Member reactivated");
    });
  }

  function showInvite(m: Member) {
    startTransition(async () => {
      const res = await regenerateInvite(m.id);
      if (!res.ok) toast.error(res.error);
      else if (res.inviteLink) setInviteLink(res.inviteLink);
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openAdd}>Add member</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Open tasks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id} className={m.active ? "" : "opacity-60"}>
                <TableCell className="font-medium">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>{m.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={m.role === "ADMIN" ? "default" : "secondary"}>
                    {m.role === "ADMIN" ? "Admin" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {!m.active ? (
                    <Badge variant="outline">Deactivated</Badge>
                  ) : m.pending ? (
                    <Badge variant="outline">Invite pending</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{m.openTasks}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                    Edit
                  </Button>
                  {m.pending && m.active && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => showInvite(m)}
                    >
                      Invite link
                    </Button>
                  )}
                  {m.id !== currentUserId && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => toggleActive(m)}
                    >
                      {m.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit member" : "Add member"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this member's details."
                : "They'll get an invite link to set their own password."}
            </DialogDescription>
          </DialogHeader>
          <form
            key={editing?.id ?? "new"}
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp phone (with country code)</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+2519..."
                defaultValue={editing?.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <NativeSelect
                id="role"
                name="role"

                defaultValue={editing?.role ?? "MEMBER"}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </NativeSelect>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : editing ? "Save changes" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite link dialog */}
      <Dialog open={!!inviteLink} onOpenChange={(o) => !o && setInviteLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite link</DialogTitle>
            <DialogDescription>
              Send this link to the member (WhatsApp works well). It expires in
              7 days, and generating a new one replaces the old one.
            </DialogDescription>
          </DialogHeader>
          <Input readOnly value={inviteLink ?? ""} onFocus={(e) => e.target.select()} />
          <DialogFooter>
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(inviteLink ?? "");
                toast.success("Link copied");
              }}
            >
              Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
import {
  PrismaClient,
  type TaskCategory,
  type TaskStatus,
  type Priority,
} from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import { addDays, dayKey, mondayOf, parseInputValue } from "../lib/dates";

const prisma = new PrismaClient();

const DOMAIN = "@demo.example";
const DEMO_PASSWORD = "Demo-pass-123";

const MEMBERS = [
  { key: "abel", name: "Abel Tesfaye", phone: "+251911000001" },
  { key: "selam", name: "Selam Girma", phone: "+251911000002" },
  { key: "dawit", name: "Dawit Haile", phone: "+251911000003" },
  { key: "ruth", name: "Ruth Mekonnen", phone: "+251911000004" },
];

type Demo = {
  day: number; // 0 = Monday of this week, -7 = last Monday
  time: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  status: TaskStatus;
  who: string[];
  link?: string;
  comments?: { by: string; text: string }[];
};

const TASKS: Demo[] = [
  {
    day: -7,
    time: "17:00",
    title: "Upload last Sunday's full sermon",
    description:
      "Full-length sermon to YouTube with the title and description sheet.",
    category: "POSTING",
    priority: "HIGH",
    status: "IN_PROGRESS",
    who: ["selam"],
    comments: [{ by: "selam", text: "Export is done, uploading tonight." }],
  },
  {
    day: 0,
    time: "10:00",
    title: "Reply to weekend comments and messages",
    description: "Answer questions on Facebook, Instagram and YouTube.",
    category: "SOCIAL",
    priority: "LOW",
    status: "DONE",
    who: ["ruth"],
  },
  {
    day: 1,
    time: "15:00",
    title: "Edit sermon highlight clip (60s)",
    description: "Pick the strongest moment, add captions and the church logo.",
    category: "EDITING",
    priority: "HIGH",
    status: "IN_PROGRESS",
    who: ["selam"],
    link: "https://drive.google.com/drive/folders/example-sermon-clip",
    comments: [
      { by: "admin", text: "Please keep it under 60 seconds for Instagram." },
      { by: "selam", text: "Got it, first cut is ready for review tomorrow." },
    ],
  },
  {
    day: 2,
    time: "18:30",
    title: "Shoot midweek prayer night",
    description:
      "Two cameras: wide from the back, close-up on the worship leader.",
    category: "SHOOT",
    priority: "MEDIUM",
    status: "TODO",
    who: ["abel", "dawit"],
  },
  {
    day: 3,
    time: "12:00",
    title: "Plan next week's social media posts",
    description: "Draft captions and pick photos for Monday to Friday.",
    category: "SOCIAL",
    priority: "MEDIUM",
    status: "TODO",
    who: ["ruth"],
  },
  {
    day: 4,
    time: "11:00",
    title: "Post sermon clip to Instagram and TikTok",
    description: "Use the approved highlight clip with the caption template.",
    category: "POSTING",
    priority: "HIGH",
    status: "IN_REVIEW",
    who: ["ruth"],
    comments: [{ by: "ruth", text: "Caption is ready, waiting for approval." }],
  },
  {
    day: 5,
    time: "16:00",
    title: "Camera and audio check for Sunday",
    description: "Charge batteries, test the mixer, format memory cards.",
    category: "SHOOT",
    priority: "MEDIUM",
    status: "TODO",
    who: ["abel"],
  },
  {
    day: 6,
    time: "09:00",
    title: "Livestream Sunday service",
    description: "Start the stream 15 minutes early. Keep a backup recording.",
    category: "SHOOT",
    priority: "HIGH",
    status: "TODO",
    who: ["abel", "dawit", "selam"],
  },
  {
    day: 6,
    time: "13:00",
    title: "Share service photos on social media",
    description: "Pick 8 to 10 photos and post them with the weekly caption.",
    category: "SOCIAL",
    priority: "LOW",
    status: "TODO",
    who: ["ruth"],
  },
  {
    day: 8,
    time: "14:00",
    title: "Edit announcements video",
    description: "30-second video for the next big event.",
    category: "EDITING",
    priority: "MEDIUM",
    status: "TODO",
    who: ["selam", "dawit"],
  },
];

async function clean() {
  // removes ALL tasks (cascades assignees and comments) and the demo members
  const tasks = await prisma.task.deleteMany();
  const users = await prisma.user.deleteMany({
    where: { email: { endsWith: DOMAIN } },
  });
  console.log(`Removed ${tasks.count} tasks and ${users.count} demo members.`);
}

async function seed() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No admin found. Run prisma/seed.ts first.");

  const already = await prisma.user.count({
    where: { email: { endsWith: DOMAIN } },
  });
  if (already > 0) {
    console.log(
      "Demo data already exists. Run with --clean first to start over."
    );
    return;
  }

  const password = await hashPassword(DEMO_PASSWORD);
  const ids: Record<string, string> = { admin: admin.id };

  for (const m of MEMBERS) {
    const id = randomUUID();
    ids[m.key] = id;
    await prisma.user.create({
      data: {
        id,
        name: m.name,
        email: `${m.key}${DOMAIN}`,
        emailVerified: true,
        phone: m.phone,
        role: "MEMBER",
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: "credential",
            password,
          },
        },
      },
    });
  }

  const monday = mondayOf(dayKey(new Date()));

  for (const t of TASKS) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        dueDate: parseInputValue(`${addDays(monday, t.day)}T${t.time}`),
        fileLink: t.link ?? null,
        createdById: admin.id,
        assignees: { create: t.who.map((k) => ({ userId: ids[k] })) },
        comments: {
          create: (t.comments ?? []).map((c) => ({
            text: c.text,
            authorId: ids[c.by],
          })),
        },
      },
    });

    await prisma.notification.createMany({
      data: t.who.map((k) => ({
        userId: ids[k],
        message: `You were assigned: ${task.title}`,
        link: `/tasks?task=${task.id}`,
        read: t.status === "DONE" || t.day < 2,
      })),
    });
  }

  console.log(`Created ${MEMBERS.length} members and ${TASKS.length} tasks.`);
  console.log(
    `Demo logins: <name>${DOMAIN} (abel, selam, dawit, ruth) / ${DEMO_PASSWORD}`
  );
}

(process.argv.includes("--clean") ? clean() : seed())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

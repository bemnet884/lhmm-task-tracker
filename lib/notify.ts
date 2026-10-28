import { prisma } from "./prisma";

export async function notify(
  userIds: string[],
  message: string,
  link?: string
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, message, link })),
  });
  // Later: also send WhatsApp here for users who have a phone number
}

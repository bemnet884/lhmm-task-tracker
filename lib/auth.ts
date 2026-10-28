import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // accounts are created by the admin only
    minPasswordLength: 8,
    // invite links are reset-password tokens that live for 7 days
    resetPasswordTokenExpiresIn: 60 * 60 * 24 * 7,
    // We don't email the token. We store it so the admin can copy the invite link.
    sendResetPassword: async ({ user, token }) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { inviteToken: token },
      });
    },
  },

  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "MEMBER", input: false },
      phone: { type: "string", required: false },
      active: { type: "boolean", defaultValue: true, input: false },
    },
  },

  // Deactivated members can't log in
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { active: true },
          });
          if (!user?.active) return false;
        },
      },
    },
  },

  plugins: [nextCookies()], // keep this last
});

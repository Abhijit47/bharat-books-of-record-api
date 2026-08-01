/**
 * Better Auth CLI configuration file
 *
 * Docs: https://www.better-auth.com/docs/concepts/cli
 */

import { betterAuth } from "better-auth";
import { betterAuthOptions } from "./src/lib/better-auth/options";
import { prisma } from "./src/lib/prisma";
import { prismaAdapter } from "@better-auth/prisma-adapter";

const { BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env;

export const auth = betterAuth({
  ...betterAuthOptions,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
});

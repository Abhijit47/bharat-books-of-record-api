import { PrismaPg } from "@prisma/adapter-pg";
import type { Context, Next } from "hono";
import { PrismaClient } from "../generated/prisma/client/client";

let prismaInstance: PrismaClient | null = null;

export function getPrisma(databaseUrl?: string): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({
    connectionString: url,
  });

  prismaInstance = new PrismaClient({ adapter });
  return prismaInstance;
}

// Lazy proxy for PrismaClient so that it doesn't throw at import/evaluation time.
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const instance = getPrisma();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

function withPrisma(c: Context, next: Next) {
  if (!c.get("prisma")) {
    c.set("prisma", prisma);
  }
  return next();
}

export default withPrisma;

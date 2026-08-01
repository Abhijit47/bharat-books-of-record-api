import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";

import { prisma } from "../prisma";
import { Role } from "../../generated/prisma/client/enums";
// import { CloudflareBindings } from "../..";

export const auth = (env: CloudflareBindings) => {
  const isDev = env.NODE_ENV === "development" || false;
  const BASE_URL = env.BETTER_AUTH_URL;
  const ADMIN_WEBSITE_URL = env.ADMIN_WEBSITE_URL;
  const PUBLIC_WEBSITE_URL = env.PUBLIC_WEBSITE_URL;

  return betterAuth({
    baseURL: BASE_URL,

    advanced: {
      database: {
        generateId: "uuid",
      },
      useSecureCookies: isDev ? false : true,

      crossSubDomainCookies: {
        enabled: true,
      },

      defaultCookieAttributes: {
        sameSite: "none",
        secure: !isDev,
        partitioned: true, // New browser standards will mandate this for foreign cookies
      },
    },

    database: prismaAdapter(prisma, {
      provider: "postgresql",
      transaction: true,
    }),

    experimental: { joins: true },

    //...other options
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },

    session: {
      storeSessionInDatabase: true,
      preserveSessionInDatabase: true,
      cookieCache: {
        maxAge: 60 * 60 * 24, // 1 day
        enabled: true,
      },
    },

    trustedOrigins: [BASE_URL, ADMIN_WEBSITE_URL, PUBLIC_WEBSITE_URL],

    user: {
      additionalFields: {
        role: {
          type: [Role.USER, Role.ADMIN, Role.MODERATOR],
          enumValues: ["USER", "ADMIN", "MODERATOR"],
          defaultValue: "USER",
        },
      },
    },

    plugins: [openAPI()],
  });
};

// export type AuthType = {
//   user: typeof auth.$Infer.Session.user | null;
//   session: typeof auth.$Infer.Session.session | null;
// };

export type AuthType = {
  user: ReturnType<typeof auth>["$Infer"]["Session"]["user"] | null;
  session: ReturnType<typeof auth>["$Infer"]["Session"]["session"] | null;
};

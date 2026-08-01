import { BetterAuthOptions } from "better-auth";

const isDev = process.env.NODE_ENV === "development" || false;

/**
 * Custom options for Better Auth
 *
 * Docs: https://www.better-auth.com/docs/reference/options
 */
export const betterAuthOptions: BetterAuthOptions = {
  /**
   * The name of the application.
   */
  appName: "Bharat Books of Records",
  /**
   * Base path for Better Auth.
   * @default "/api/auth"
   */
  basePath: "/api",

  // .... More options
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
};

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { AuthType } from "../lib/better-auth";

export type AuthCtx = {
  Variables: {
    user: AuthType["user"];
    session: AuthType["session"];
  };
};

export const authorizationMiddleware = createMiddleware<AuthCtx>(
  async (c, next) => {
    const user = c.get("user");

    // console.log('authorizationMiddleware user', user);

    if (!user) {
      throw new HTTPException(401, {
        message: "Unauthorized",
        cause: "Unauthorized",
      });
    }

    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      throw new HTTPException(403, {
        message: "Forbidden",
        cause: "Forbidden",
      });
    }

    await next();
  },
);

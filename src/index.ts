import { Hono } from "hono";
import { auth } from "./lib/better-auth";
import { PrismaClient } from "./generated/prisma/client/client";
import { AuthCtx } from "./middlewares/auth-middleware";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";

import posts from "./posts";
import { showRoutes } from "hono/dev";

type RouteCtx = {
  Bindings: CloudflareBindings;
  Variables: {
    prisma: PrismaClient;
  } & AuthCtx["Variables"];
};

const { BETTER_AUTH_URL, ADMIN_WEBSITE_URL, PUBLIC_WEBSITE_URL } = process.env;

const app = new Hono<RouteCtx>();

app.use(poweredBy());
app.use(logger());
app.use(prettyJSON());

// /api/auth/* or '*', // replace with "*" to enable cors for all routes
app.use(
  "*",
  cors({
    origin: [BETTER_AUTH_URL, ADMIN_WEBSITE_URL, PUBLIC_WEBSITE_URL],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/message", (c) => {
  return c.text(`Hello Hono! ${c.env.PORT}`);
});

app.use("/posts/*", async (c, next) => {
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return c.json(
      {
        status: "error",
        message: "Unauthorized",
      },
      401,
    );
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

app.on(["GET", "POST"], "/api/*", (c) => {
  return auth(c.env).handler(c.req.raw);
});

// 😃
app.route("/posts", posts);

showRoutes(app, {
  verbose: true,
  colorize: true,
});

export default app;

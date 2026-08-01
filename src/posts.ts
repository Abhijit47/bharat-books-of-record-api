import { HTTPException } from "hono/http-exception";
import { Hono } from "hono";

import { PrismaClient } from "./generated/prisma/client/client";
import withPrisma from "./lib/prisma";
import {
  AuthCtx,
  authorizationMiddleware,
} from "./middlewares/auth-middleware";
import { zValidator } from "./middlewares/post-input-validator";
import { postSchema } from "./lib/validators/post-schema";
import {
  UploadApiResponse,
  UploadApiErrorResponse,
  UploadApiOptions,
} from "cloudinary";

import { getCldClient } from "./configs/cloudinary";
import { auth } from "./lib/better-auth";

type RouteCtx = {
  Bindings: CloudflareBindings;
  Variables: {
    prisma: PrismaClient;
  } & AuthCtx["Variables"];
};

const app = new Hono<RouteCtx>();

// GET /all - Fetch all posts
app.get("/all", withPrisma, async (c) => {
  const prisma = c.get("prisma");

  const posts = await prisma.post.findMany({});

  return c.json(
    {
      status: "success",
      data: posts,
      message: "Posts fetched successfully",
    },
    200,
  );
});

const protectedApp = new Hono<RouteCtx>();

protectedApp.use(async (c, next) => {
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });

  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  } else {
    c.set("user", null);
    c.set("session", null);
  }
  await next();
});

protectedApp.use(authorizationMiddleware);

// POST /new - Create a new post
protectedApp.post(
  "/new",
  zValidator("json", postSchema),
  withPrisma,
  async (c) => {
    const body = c.req.valid("json");

    // console.log('req.body', body);

    const prisma = c.get("prisma");

    const user = c.get("user");
    // console.log('user', user);

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

    try {
      const newPost = await prisma.post.create({
        data: {
          title: body.title,
          slug: body.slug,
          summary: body.summary,
          content: body.content,
          cover: body.cover,
          tags: body.tags || [],
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        omit: {
          createdAt: true,
          updatedAt: true,
        },
      });
      return c.json(
        { data: newPost, message: "Post created successfully" },
        201,
      );
    } catch (error) {
      console.error("Error creating post:", error);
      throw new HTTPException(500, {
        message: "Internal server error",
        cause: "Internal server error",
      });
    }
  },
);

// GET /:id - Fetch a post by ID
protectedApp.get("/:id", withPrisma, async (c) => {
  const postId = c.req.param("id");

  const prisma = c.get("prisma");

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!post) {
      throw new HTTPException(404, {
        message: "Post not found",
        cause: "Post not found",
      });
    }

    return c.json(
      {
        status: "success",
        data: post,
        message: "Post fetched successfully",
      },
      200,
    );
  } catch (err) {
    console.log("err", err);

    throw new HTTPException(500, {
      message: "Internal server error",
      cause: err,
    });
  }
});

// PATCH /:id - Update a post by ID
protectedApp.patch(
  "/:id",
  zValidator("json", postSchema.partial()),
  withPrisma,
  async (c) => {
    const postId = c.req.param("id");
    const body = c.req.valid("json");

    const prisma = c.get("prisma");

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new HTTPException(404, {
        message: "Post not found",
        cause: "Post not found",
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id: existingPost.id },
      data: {
        title: body.title ? body.title : existingPost.title,
        slug: body.slug ? body.slug : existingPost.slug,
        summary: body.summary ? body.summary : existingPost.summary,
        content: body.content ? body.content : existingPost.content,
        cover: body.cover ? body.cover : existingPost.cover,
        tags: body.tags ? body.tags : existingPost.tags,
      },
      omit: {
        updatedAt: true,
        createdAt: true,
      },
    });

    return c.json(
      {
        status: "success",
        data: updatedPost,
        message: "Post updated successfully",
      },
      200,
    );
  },
);

// DELETE /:id - Delete a post by ID
protectedApp.delete("/:id", withPrisma, async (c) => {
  const postId = c.req.param("id");
  const prisma = c.get("prisma");

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    throw new HTTPException(404, {
      message: "Post not found",
      cause: "Post not found",
    });
  }

  const deletedPost = await prisma.post.delete({
    where: { id: existingPost.id },
  });

  return c.json(
    {
      status: "success",
      data: deletedPost,
      message: "Post deleted successfully",
    },
    200,
  );
});

type UploadResponse = UploadApiResponse | UploadApiErrorResponse | undefined;

protectedApp.post("/upload-cover", withPrisma, async (c) => {
  const body = await c.req.parseBody({ all: true });
  const value = body["file"];

  try {
    const files = Array.isArray(value)
      ? value.filter((item): item is File => item instanceof File)
      : value instanceof File
        ? [value]
        : [];

    if (files.length === 0) {
      return c.text("At least one file is required", 400);
    }

    if (files.length > 1) {
      return c.text("Only one file is allowed", 400);
    }

    const cover = files[0];

    const fileName = `${cover.name}-${crypto.randomUUID()}`;
    const arrayBuffer = await cover.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const uploadConfig: UploadApiOptions = {
      folder: "records",
      public_id: fileName,
      resource_type: cover.type.startsWith("image/") ? "image" : "auto",
      // async: true,
      filename_override: fileName,
      upload_preset: "upload-cover",
    };

    const client = getCldClient(c.env);

    const uploaderResult: UploadResponse = await new Promise(
      (resolve, reject) => {
        client.uploader
          .upload_stream(uploadConfig, (error, result) => {
            if (error) {
              return reject(error);
            } else {
              return resolve(result);
            }
          })
          .end(buffer);
      },
    );

    if (!uploaderResult) {
      throw new HTTPException(500, {
        message: "File upload failed",
        cause: "File upload failed",
      });
    }

    return c.json({
      count: files.length,
      files: {
        name: cover.name,
        size: cover.size,
        type: cover.type,
      },
      url: uploaderResult.secure_url,
      message: "File uploaded successfully",
    });
  } catch (err) {
    throw new HTTPException(500, {
      message: "Internal server error",
      cause: err,
    });
  }
});

app.route("/", protectedApp);

export default app;

export type AppType = typeof app;

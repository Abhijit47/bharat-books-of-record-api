import { zValidator as zv } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import { HTTPException } from "hono/http-exception";
import type z from "zod";

// throw a zod validate error instead of directly returning an error response.
export const zValidator = <
  T extends z.ZodSchema,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result, c) => {
    // console.log('zValidator result', result);
    if (!result.success) {
      throw new HTTPException(400, {
        message: result.error.issues.map((issue) => issue.message).join(", "),
        cause: result.error,
      });
    }
  });

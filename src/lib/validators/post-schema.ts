import { z } from "zod";

// const postSchema = z.object({
//   title: z.string().min(1, { message: 'Title is required' }).openapi({
//     description: 'The title of the post',
//   }),
//   slug: z.string().min(1, { message: 'Slug is required' }),
//   summary: z.string().min(1, { message: 'Summary is required' }),
//   content: z.string().min(1, { message: 'Content is required' }),
//   cover: z.string().min(1, { message: 'Cover is required' }),
//   tags: z.array(z.string()).optional(),
//   authorId: z.string().min(1, { message: 'Author ID is required' }),
// });

export const postSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  summary: z.string().min(1, { message: "Summary is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  cover: z.string().min(1, { message: "Cover is required" }),
  tags: z.array(z.string()).optional(),
  authorId: z.string().min(1, { message: "Author ID is required" }),
});

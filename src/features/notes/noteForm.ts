import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "At most 200 characters"),
  body: z.string().max(20_000, "At most 20,000 characters"),
  link: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Link must start with http:// or https://"),
});
export type NoteForm = z.infer<typeof noteSchema>;

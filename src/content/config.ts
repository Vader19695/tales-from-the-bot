import { defineCollection, z } from 'astro:content';

const stories = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    model: z.string(),
    prompt: z.string(),
    humanPrompt: z.boolean().optional(),
    slug: z.string().optional(),
  }),
});

export const collections = { stories };

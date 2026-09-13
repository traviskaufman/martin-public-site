import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const comparisons = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/comparisons" }),
  schema: z.object({
    order: z.number().int(),
    heading: z.string().min(1),
    differentiator: z.string().min(1),
    prompt: z.string().min(1),
    vanilla: z.string().min(1),
    martin: z.string().min(1),
  }),
});

export const collections = { comparisons };

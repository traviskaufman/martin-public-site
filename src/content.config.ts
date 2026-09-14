import { defineCollection, reference, z } from "astro:content";
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

const scenes = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/scenes" }),
  schema: z
    .object({
      order: z.number().int(),
      section: z.string().min(1),
      title: z.string().min(1),
      entry: z.enum(["playing", "finished"]).default("playing"),
      command: z.string().min(1).optional(),
      transcript: z.string().min(1).optional(),
      comparison: reference("comparisons").optional(),
      startAt: z.string().min(1).optional(),
      differentiator: z.string().min(1).optional(),
    })
    .refine((scene) => scene.transcript || scene.comparison, {
      message: "a scene needs a transcript or a comparison",
    }),
});

export const collections = { comparisons, scenes };

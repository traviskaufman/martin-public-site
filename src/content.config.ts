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

const beats = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/beats" }),
  schema: z
    .object({
      order: z.number().int(),
      section: z.string().min(1),
      continues: z.boolean().default(false),
      title: z.string().min(1).optional(),
      command: z.string().min(1).optional(),
      transcript: z.string().min(1).optional(),
      comparison: reference("comparisons").optional(),
      startAt: z.string().min(1).optional(),
      inlineOnPhone: z.boolean().default(true),
    })
    .refine((beat) => beat.continues !== Boolean(beat.title && beat.command), {
      message:
        "an opening beat has a title and a command; a continuing beat has neither",
    })
    .refine((beat) => !beat.continues || beat.transcript || beat.comparison, {
      message: "a continuing beat needs a transcript or a comparison",
    }),
});

export const collections = { comparisons, beats };

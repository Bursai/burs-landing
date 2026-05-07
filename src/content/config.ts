// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(3).max(140),
    description: z.string().min(40).max(220),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    schema: z.enum(['Article', 'TechArticle', 'OpinionPiece']).default('Article')
  })
});

export const collections = { blog };

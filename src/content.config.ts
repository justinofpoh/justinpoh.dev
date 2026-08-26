import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notes = defineCollection({
	loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		category: z.enum(['Essay', 'Tech', 'Lab Notes', 'Micropost', 'Twitter Archive']),
		tags: z.array(z.string()).default([]),
		external: z.string().url().optional(),
	}),
});

export const collections = { notes };

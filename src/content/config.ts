import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

import { DEFAULT_LANG, SUPPORTED_LANGS } from "../config.i18n";

const createPostCollection = (basePath?: string) =>
  defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: basePath ?? "./src/content/posts" }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        draft: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        ogImage: z.string().optional(),
        notes: z
          .array(
            z.object({
              text: z.string(),
              href: z.string().url().optional()
            })
          )
          .optional(),
        canonicalUrl: z.string().url().optional(),
      }),
  });

const createPageCollection = (basePath?: string) =>
  defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: basePath ?? "./src/content/pages" }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    schema: ({ image }) =>
      z.object({
        title: z.string().optional(),
      }),
  });

const allCollections: Record<string, ReturnType<typeof defineCollection>> = {
  posts: createPostCollection(),
  pages: createPageCollection(),
};

for (const { code } of SUPPORTED_LANGS) {
  if (code === DEFAULT_LANG) continue;
  allCollections[`posts_${code}`] = createPostCollection(`./src/content/${code}/posts`);
  allCollections[`pages_${code}`] = createPageCollection(`./src/content/${code}/pages`);
}

export const collections = allCollections;

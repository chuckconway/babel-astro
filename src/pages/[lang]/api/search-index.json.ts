export const prerender = true;

// Defer astro:content import so this module remains testable in node
import Fuse from "fuse.js";

import { DEFAULT_LANG, SUPPORTED_LANGS } from "../../../config.i18n";
import type { PostLike } from "../../../services/PostService";
import { buildSearchItems } from "../../../services/SearchService";

export async function getStaticPaths() {
  const paths: { params: { lang: string } }[] = [];
  for (const { code } of SUPPORTED_LANGS) {
    if (code === DEFAULT_LANG) continue;
    paths.push({ params: { lang: code } });
  }
  return paths;
}

/**
 * Build search index for translated content at build time.
 */
export async function GET({ params }) {
  const { lang } = params;
  const collectionName = lang === DEFAULT_LANG ? "posts" : `posts_${lang}`;

  const { getCollection } = await import("astro:content");
  const posts = (await getCollection(collectionName))
    .filter(({ data }) => !data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const data = buildSearchItems(posts as unknown as PostLike[]);

  const index = Fuse.createIndex(["title", "description", "content"], data);

  return new Response(JSON.stringify({ data, index }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

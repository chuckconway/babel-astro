import { getCollection } from "astro:content";

import { DEFAULT_LANG, SUPPORTED_LANGS } from "../config.i18n";

export async function buildTranslatedLangPaths(): Promise<{ params: { lang: string } }[]> {
  const paths: { params: { lang: string } }[] = [];
  for (const { code } of SUPPORTED_LANGS) {
    if (code === DEFAULT_LANG) continue;
    paths.push({ params: { lang: code } });
  }
  return paths;
}

export async function buildDefaultSlugPathsForCollection(
  base: string,
): Promise<{ params: { slug: string } }[]> {
  const collUnknown = await getCollection(base as never);
  const coll = collUnknown as Array<{ id: string }>;
  return coll.map((post) => ({ params: { slug: post.id } }));
}

export async function buildTranslatedSlugPathsForCollection(
  base: string,
): Promise<{ params: { lang: string; slug: string } }[]> {
  const paths: { params: { lang: string; slug: string } }[] = [];
  for (const { code } of SUPPORTED_LANGS) {
    if (code === DEFAULT_LANG) continue;
    const collUnknown = await getCollection(`${base}_${code}` as never);
    const coll = collUnknown as Array<{ id: string }>;
    for (const post of coll) {
      paths.push({ params: { lang: code, slug: post.id } });
    }
  }
  return paths;
}

export async function buildDefaultTagPathsForCollection(
  base: string,
): Promise<{ params: { tag: string } }[]> {
  const postsUnknown = await getCollection(base as never);
  const posts = postsUnknown as Array<{ data: { tags?: string[] } }>;
  const tags = new Set<string>();
  posts.forEach((p) => (p.data.tags ?? []).forEach((t) => tags.add(t)));
  return Array.from(tags).map((tag) => ({ params: { tag } }));
}

export async function buildTranslatedTagPathsForCollection(
  base: string,
): Promise<{ params: { lang: string; tag: string } }[]> {
  const paths: { params: { lang: string; tag: string } }[] = [];
  for (const { code } of SUPPORTED_LANGS) {
    if (code === DEFAULT_LANG) continue;
    const postsUnknown = await getCollection(`${base}_${code}` as never);
    const posts = postsUnknown as Array<{ data: { tags?: string[] } }>;
    const tags = new Set<string>();
    posts.forEach((p) => (p.data.tags ?? []).forEach((t) => tags.add(t)));
    for (const tag of tags) {
      paths.push({ params: { lang: code, tag } });
    }
  }
  return paths;
}

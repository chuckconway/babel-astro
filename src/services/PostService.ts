import { DEFAULT_LANG } from "../config.i18n";

export interface PostDataShape {
  title: string;
  description?: string;
  date: Date;
  draft?: boolean;
  tags?: string[];
  featured?: boolean;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface PostLike {
  id: string;
  body: string;
  data: PostDataShape;
}

export interface AdjacentLinks<T = PostLike> {
  previous?: T;
  next?: T;
}

export function getCollectionNameForLang(lang?: string): string {
  const language = lang ?? DEFAULT_LANG;
  return language === DEFAULT_LANG ? "posts" : `posts_${language}`;
}

export async function loadNonDraftPosts(lang?: string): Promise<PostLike[]> {
  const collectionName = getCollectionNameForLang(lang);
  const { getCollection } = await import("astro:content");
  const entriesUnknown = await getCollection(collectionName as never);
  const all = (entriesUnknown as unknown[]).filter((p) => p && (p as any).data) as PostLike[];
  return all.filter((p) => !(p.data?.draft === true));
}

export function sortFeaturedThenRecent<T extends PostLike>(posts: T[]): T[] {
  const featured = posts
    .filter(({ data }) => !!data.featured)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const regular = posts
    .filter(({ data }) => !data.featured)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return [...featured, ...regular];
}

export async function getSortedPosts(lang?: string): Promise<PostLike[]> {
  const posts = await loadNonDraftPosts(lang);
  return sortFeaturedThenRecent(posts);
}

export function paginatePosts<T>(
  items: T[],
  page: number,
  pageSize: number,
): {
  pageItems: T[];
  totalPages: number;
  startIndex: number;
} {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);
  return { pageItems, totalPages, startIndex };
}

export function getAdjacentByDate<T extends PostLike>(
  posts: T[],
  currentId: string,
): AdjacentLinks<T> {
  const sortedByAsc = [...posts].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  const index = sortedByAsc.findIndex((p) => p.id === currentId);
  const previous = index > 0 ? sortedByAsc[index - 1] : undefined;
  const next = index >= 0 && index < sortedByAsc.length - 1 ? sortedByAsc[index + 1] : undefined;
  return { previous, next };
}

export function getBasicRelatedByTags<T extends PostLike>(
  current: T,
  candidates: T[],
  limit = 3,
): T[] {
  const currentTags = current.data.tags ?? [];
  if (currentTags.length === 0) return [];

  return candidates
    .filter((p) => p.id !== current.id && (p.data.tags ?? []).some((t) => currentTags.includes(t)))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, limit);
}

export async function getPostsByTag(tag: string, lang?: string): Promise<PostLike[]> {
  const posts = await loadNonDraftPosts(lang);
  return posts
    .filter((p) => (p.data.tags ?? []).includes(tag))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function groupPostsByYear<T extends PostLike>(posts: T[]): Map<number, T[]> {
  const grouped = new Map<number, T[]>();
  for (const post of posts) {
    const year = post.data.date.getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(post);
  }
  // Ensure each year's posts are newest-first
  for (const [, arr] of grouped) {
    arr.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  }
  return grouped;
}

export async function getArchiveGroups(
  lang?: string,
): Promise<Array<{ year: number; posts: PostLike[] }>> {
  const posts = await getSortedPosts(lang);
  const grouped = groupPostsByYear(posts);
  const years = Array.from(grouped.keys()).sort((a, b) => b - a);
  return years.map((y) => ({ year: y, posts: grouped.get(y)! }));
}

import { excerpt } from "../utils/excerpt";
import { getReadingTimeMinutes } from "../utils/readingTime";
import { getSortedPosts, type PostLike } from "./PostService";

export interface SearchItem {
  title: string;
  description?: string;
  slug: string;
  ogImage?: unknown;
  content: string;
  date: string;
  body: string;
  readingTimeMinutes: number;
}

export function mapPostToSearchItem(post: PostLike): SearchItem {
  return {
    title: post.data.title,
    description: post.data.description ?? excerpt(post.body),
    slug: post.id,
    ogImage: post.data.ogImage,
    content: excerpt(post.body, 1_000_000),
    date: post.data.date.toISOString(),
    body: post.body,
    readingTimeMinutes: getReadingTimeMinutes(post.body),
  };
}

export function buildSearchItems(posts: PostLike[]): SearchItem[] {
  return posts.map(mapPostToSearchItem);
}

export async function getSearchItemsForLang(lang?: string): Promise<SearchItem[]> {
  const posts = await getSortedPosts(lang);
  return buildSearchItems(posts);
}

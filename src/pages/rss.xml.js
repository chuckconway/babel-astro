import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

import { SITE } from "../config";
import { excerpt } from "../utils/excerpt";

export async function GET() {
  const allPosts = await getCollection("posts");
  const posts = allPosts
    .filter(({ data }) => !data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: SITE.site,
    items: posts.map((post) => ({
      link: `/posts/${post.id}/`,
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? excerpt(post.body),
    })),
  });
}

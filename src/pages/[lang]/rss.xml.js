import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

import { SITE } from "../../config";
import { DEFAULT_LANG, SUPPORTED_LANGS } from "../../config.i18n";
import { excerpt } from "../../utils/excerpt";

export async function getStaticPaths() {
  return SUPPORTED_LANGS.filter(({ code }) => code !== DEFAULT_LANG).map(({ code }) => ({
    params: { lang: code },
  }));
}

export async function GET({ params }) {
  const { lang } = params;
  const collection = lang === DEFAULT_LANG ? "posts" : `posts_${lang}`;
  const allPosts = await getCollection(collection);
  const posts = allPosts
    .filter(({ data }) => !data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const prefix = lang === DEFAULT_LANG ? "" : `/${lang}`;

  return rss({
    title: `${SITE.title} (${lang})`,
    description: SITE.description,
    site: SITE.site,
    stylesheet: undefined,
    items: posts.map((post) => ({
      link: `${prefix}/posts/${post.id}/`,
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? excerpt(post.body),
    })),
  });
}

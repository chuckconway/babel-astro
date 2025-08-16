import Fuse from "fuse.js";
import type { Post } from "../components/PostListReact";

type SearchBundle = { data: Post[]; fuse: Fuse<Post> };

const bundleCache: Record<string, Promise<SearchBundle>> = {};

export function loadSearch(lang: string, defaultLang: string): Promise<SearchBundle> {
  const pathPrefix = lang && lang !== defaultLang ? `/${lang}` : "";
  const cacheKey = pathPrefix || "/";
  if (!bundleCache[cacheKey]) {
    bundleCache[cacheKey] = (async () => {
      const res = await fetch(`${pathPrefix}/api/search-index.json`);
      const { data, index } = await res.json();
      const fuse = new Fuse(
        data as Post[],
        { keys: ["title", "description", "content"] },
        Fuse.parseIndex(index),
      );
      return { data: data as Post[], fuse };
    })();
  }
  return bundleCache[cacheKey];
}



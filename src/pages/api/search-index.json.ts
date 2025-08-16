export const prerender = true;

// Defer astro:content import so this module remains testable in node
import Fuse from "fuse.js";

import type { PostLike } from "../../services/PostService";
import { buildSearchItems } from "../../services/SearchService";
import { errorFromUnknown, logError } from "../../utils/errors";

export async function GET() {
  try {
    const { getCollection } = await import("astro:content");
    const posts = (await getCollection("posts"))
      .filter(({ data }) => !data.draft)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    const data = buildSearchItems(posts as unknown as PostLike[]);
    const index = Fuse.createIndex(["title", "description", "content"], data);

    return new Response(JSON.stringify({ data, index }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logError("GET /api/search-index.json", err);
    const e = errorFromUnknown(err);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

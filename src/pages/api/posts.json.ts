export const prerender = true;

import type { PostLike } from "../../services/PostService";
import { buildSearchItems } from "../../services/SearchService";
import { errorFromUnknown, logError } from "../../utils/errors";

export async function GET() {
  try {
    const { getCollection } = await import("astro:content");
    const posts = (await getCollection("posts"))
      .filter(({ data }) => !data.draft)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    const searchData = buildSearchItems(posts as unknown as PostLike[]).map(
      ({ title, description, slug, content }) => ({
        title,
        description,
        slug,
        content,
      }),
    );

    return new Response(JSON.stringify(searchData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logError("GET /api/posts.json", err);
    const e = errorFromUnknown(err);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

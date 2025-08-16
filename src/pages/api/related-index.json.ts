export const prerender = true;

import { buildRelatedIndex } from "../../services/RelatedService";
import { errorFromUnknown, logError } from "../../utils/errors";

export async function GET() {
  try {
    const idx = await buildRelatedIndex();
    return new Response(JSON.stringify(idx), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    logError("GET /api/related-index.json", err);
    const e = errorFromUnknown(err);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

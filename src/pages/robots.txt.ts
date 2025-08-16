export const prerender = true;

import type { APIRoute } from "astro";

import { SITE } from "../config";

export const GET: APIRoute = () => {
  const sitemapUrl = new URL("sitemap-index.xml", SITE.site).href;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

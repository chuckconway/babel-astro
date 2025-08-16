export interface RelatedDoc {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  vector: Array<[string, number]>; // [term, weight]
}

export interface RelatedIndex {
  version: number;
  lang: string;
  terms: Array<[string, number]>; // idf
  docs: RelatedDoc[];
}

export async function loadRelatedIndex(url: string): Promise<RelatedIndex> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to load related index");
  return res.json();
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  a.forEach((wa, term) => {
    const wb = b.get(term) ?? 0;
    dot += wa * wb;
    na += wa * wa;
  });
  b.forEach((wb) => {
    nb += wb * wb;
  });
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function toMap(vec: Array<[string, number]>): Map<string, number> {
  const m = new Map<string, number>();
  for (const [t, w] of vec) m.set(t, w);
  return m;
}

export function scoreRelated(
  current: RelatedDoc,
  candidates: RelatedDoc[],
  opts?: { tagBoost?: number; recencyHalfLifeDays?: number },
): RelatedDoc[] {
  const tagBoost = opts?.tagBoost ?? 0.12;
  const halfLife = (opts?.recencyHalfLifeDays ?? 180) * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const curMap = toMap(current.vector);

  const scored = candidates
    .filter((c) => c.slug !== current.slug)
    .map((c) => {
      const sim = cosine(curMap, toMap(c.vector));
      const sharedTags = c.tags.filter((t) => current.tags.includes(t)).length;
      const tagScore = Math.min(1, sharedTags * tagBoost);
      const ageMs = Math.max(0, now - new Date(c.date).getTime());
      const recency = Math.exp(-ageMs / halfLife);
      const total = sim + tagScore + 0.05 * recency;
      return { doc: c, score: total };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.doc);

  return scored;
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "as",
  "by",
  "at",
  "from",
  "that",
  "this",
  "it",
  "its",
  "into",
  "your",
  "you",
  "we",
  "our",
  "but",
  "not",
  "can",
  "will",
  "do",
  "does",
  "did",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && t.length > 1);
}

import type { PostDataShape } from "./PostService";

export async function buildRelatedIndex(): Promise<RelatedIndex> {
  const { getCollection } = await import("astro:content");
  const { excerpt } = await import("../utils/excerpt");
  const postsUnknown = await getCollection("posts");
  const posts = (postsUnknown as Array<{ id: string; body: string; data: PostDataShape }>).filter(
    ({ data }) => !data.draft,
  );

  const docsTokens: string[][] = [];
  const slugs: string[] = [];
  const titles: string[] = [];
  const dates: string[] = [];
  const tagsList: string[][] = [];

  for (const post of posts) {
    const text = `${post.data.title}\n${post.data.description ?? excerpt(post.body)}\n${post.body.slice(0, 4000)}`;
    const tokens = tokenize(text);
    docsTokens.push(tokens);
    slugs.push(post.id);
    titles.push(post.data.title);
    dates.push(post.data.date.toISOString());
    tagsList.push(post.data.tags ?? []);
  }

  const df = new Map<string, number>();
  for (const tokens of docsTokens) {
    const seen = new Set<string>();
    for (const t of tokens) {
      if (seen.has(t)) continue;
      seen.add(t);
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const N = docsTokens.length;
  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    const value = Math.log((N + 1) / (freq + 1)) + 1;
    idf.set(term, value);
  }

  const docs: RelatedDoc[] = [];
  docsTokens.forEach((tokens, i) => {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const len = tokens.length || 1;
    const entries: Array<[string, number]> = [];
    tf.forEach((count, term) => {
      const w = (count / len) * (idf.get(term) ?? 0);
      if (w > 0) entries.push([term, w]);
    });
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 25);
    docs.push({ slug: slugs[i], title: titles[i], date: dates[i], tags: tagsList[i], vector: top });
  });

  const terms: Array<[string, number]> = Array.from(idf.entries());
  return { version: 1, lang: "default", terms, docs };
}

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildRelatedIndex, type RelatedDoc, scoreRelated } from "../src/services/RelatedService";

let mockedCollection: any[] = [];

vi.mock("astro:content", () => ({
  getCollection: async () => mockedCollection,
}));

vi.mock("../src/utils/excerpt", () => ({
  excerpt: (body: string, len = 200) => body.slice(0, len),
}));

afterEach(() => {
  vi.restoreAllMocks();
  mockedCollection = [];
});

function makePost(id: string, title: string, body: string, date: string, tags: string[] = []) {
  return {
    id,
    body,
    data: {
      title,
      description: undefined,
      date: new Date(date),
      tags,
      draft: false,
    },
  } as any;
}

describe("buildRelatedIndex", () => {
  it("builds idf terms and per-doc top vectors", async () => {
    mockedCollection = [
      makePost("a", "Alpha Post", "alpha beta gamma", "2023-01-01", ["x"]),
      makePost("b", "Beta Post", "beta gamma delta", "2024-01-01", ["x", "y"]),
    ];
    const idx = await buildRelatedIndex();
    expect(idx.version).toBe(1);
    expect(idx.lang).toBe("default");
    expect(Array.isArray(idx.terms)).toBe(true);
    expect(idx.docs.length).toBe(2);
    for (const d of idx.docs) {
      expect(d.slug).toBeDefined();
      expect(d.title).toBeDefined();
      expect(d.vector.length).toBeGreaterThan(0);
      expect(d.vector.length).toBeLessThanOrEqual(25);
    }
  });

  it("scoreRelated ranks candidates with tag/recency boost", () => {
    const now = new Date();
    const mk = (
      slug: string,
      tags: string[],
      daysAgo: number,
      vector: Array<[string, number]>,
    ): RelatedDoc => ({
      slug,
      title: slug,
      date: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
      tags,
      vector,
    });
    const current = mk("cur", ["x"], 0, [["alpha", 1]]);
    const cands = [
      mk("old-untagged", [], 400, [["alpha", 0.9]]),
      mk("new-tagged", ["x"], 1, [["alpha", 0.8]]),
      mk("mid", [], 30, [["alpha", 0.85]]),
    ];
    const best = scoreRelated(current, cands, { tagBoost: 0.2, recencyHalfLifeDays: 180 });
    expect(best[0].slug).toBe("new-tagged");
  });
});

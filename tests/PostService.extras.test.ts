import { afterEach, describe, expect, it, vi } from "vitest";

import * as PostService from "../src/services/PostService";

let mockedCollection: any[] = [];
vi.mock("astro:content", () => ({
  getCollection: async () => mockedCollection,
}));

function makePost(id: string, date: string, tags: string[] = [], featured = false) {
  return {
    id,
    body: "",
    data: {
      title: id,
      date: new Date(date),
      tags,
      featured,
    },
  } as any;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getBasicRelatedByTags", () => {
  it("returns only posts sharing tags, excludes current, sorted by date desc and limited", () => {
    const current = makePost("cur", "2022-01-01", ["a", "b"]);
    const pool = [
      makePost("p1", "2021-01-01", ["x"]),
      makePost("p2", "2023-01-01", ["a"]),
      makePost("p3", "2020-01-01", ["b"]),
      makePost("p4", "2024-01-01", ["a", "z"]),
      makePost("cur", "2022-01-01", ["a"]),
    ];
    const result = PostService.getBasicRelatedByTags(current, pool, 2);
    expect(result.map((p: any) => p.id)).toEqual(["p4", "p2"]);
  });
});

describe("getPostsByTag", () => {
  it("filters non-draft posts by tag and sorts desc", async () => {
    mockedCollection = [
      makePost("old", "2021-01-01", ["x"]),
      makePost("a", "2023-01-01", ["t"]),
      makePost("b", "2022-01-01", ["t"]),
    ];
    const res = await PostService.getPostsByTag("t", "en");
    expect(res.map((p: any) => p.id)).toEqual(["a", "b"]);
  });
});

describe("getArchiveGroups", () => {
  it("groups posts by year with newest years first", async () => {
    mockedCollection = [
      makePost("a", "2021-05-01"),
      makePost("b", "2021-06-01"),
      makePost("c", "2020-02-01"),
    ];
    const groups = await PostService.getArchiveGroups("en");
    expect(groups.map((g) => g.year)).toEqual([2021, 2020]);
    const y2021 = groups.find((g) => g.year === 2021)!;
    expect(y2021.posts.map((p: any) => p.id)).toEqual(["b", "a"]);
  });
});

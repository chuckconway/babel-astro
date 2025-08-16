import { describe, expect, it } from "vitest";

import {
  getAdjacentByDate,
  groupPostsByYear,
  sortFeaturedThenRecent,
} from "../src/services/PostService";

function makePost(id: string, date: string, featured = false, tags: string[] = []) {
  return {
    id,
    body: "",
    data: {
      title: id,
      date: new Date(date),
      featured,
      tags,
    },
  } as any;
}

describe("PostService utilities", () => {
  it("sortFeaturedThenRecent places featured first and sorts by date desc", () => {
    const posts = [
      makePost("a", "2020-01-01", false),
      makePost("b", "2022-01-01", true),
      makePost("c", "2021-01-01", false),
      makePost("d", "2023-01-01", true),
    ];
    const sorted = sortFeaturedThenRecent(posts);
    expect(sorted.map((p: any) => p.id)).toEqual(["d", "b", "c", "a"]);
  });

  it("getAdjacentByDate returns previous and next by date", () => {
    const posts = [
      makePost("old", "2020-01-01"),
      makePost("mid", "2021-01-01"),
      makePost("new", "2022-01-01"),
    ];
    const { previous, next } = getAdjacentByDate(posts, "mid");
    expect(previous?.id).toBe("old");
    expect(next?.id).toBe("new");
  });

  it("groupPostsByYear groups and sorts within each year", () => {
    const posts = [
      makePost("a", "2021-05-01"),
      makePost("b", "2021-06-01"),
      makePost("c", "2020-02-01"),
    ];
    const grouped = groupPostsByYear(posts);
    expect(Array.from(grouped.keys()).sort()).toEqual([2020, 2021]);
    expect(grouped.get(2021)?.map((p: any) => p.id)).toEqual(["b", "a"]);
  });
});

// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PostListReact from "../src/components/PostListReact";

vi.mock("../src/i18n", () => ({ t: () => "5 min read" }));
vi.mock("../src/utils/date", () => ({ formatLongDate: () => "Jan 1, 2024" }));
vi.mock("../src/utils/urls", () => ({
  postPath: (_l: string, slug: string) => `/en/posts/${slug}`,
}));

describe("PostListReact", () => {
  it("renders post title, link, image, date and reading time", () => {
    render(
      <PostListReact
        lang="en"
        posts={[
          {
            title: "Hello",
            slug: "hello",
            ogImage: "/img.jpg",
            date: "2024-01-01",
            body: "Body text",
            readingTimeMinutes: 5,
          },
        ]}
      />,
    );

    const titleLink = screen.getByText("Hello").closest("a");
    expect(titleLink).toHaveAttribute("href", "/en/posts/hello");

    const image = screen.getByRole("img", { name: "Hello" });
    expect(image).toHaveAttribute("src", "/img.jpg");
    expect(image.closest("a")).toHaveAttribute("href", "/en/posts/hello");
    const meta = screen.getByText(/5 min read/i).closest("p");
    expect(meta).toBeTruthy();
    expect(meta?.textContent).toContain("Jan 1, 2024");
  });
});

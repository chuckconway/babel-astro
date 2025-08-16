import type { CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

export interface PostListItem {
  id: string;
  title: string;
  description?: string;
  date: Date;
  tags?: string[];
  featured?: boolean;
}

export interface RouteParamsLang {
  lang: string;
}

export interface RouteParamsSlug {
  slug: string;
}

export interface RouteParamsLangSlug extends RouteParamsLang, RouteParamsSlug {}

export interface RouteParamsTag {
  tag: string;
}

export interface RouteParamsLangTag extends RouteParamsLang, RouteParamsTag {}

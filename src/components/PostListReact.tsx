/* @refresh skip */
/** @jsxImportSource react */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";

import { DEFAULT_LANG } from "../config.i18n";
import { t } from "../i18n";
import { formatLongDate } from "../utils/date";
import { excerpt } from "../utils/excerpt";
import { formatNumber } from "../utils/format";
import { postPath } from "../utils/urls";

export type Post = {
  title: string;
  description?: string;
  slug: string;
  ogImage?: string | { src: string };
  body?: string;
  date?: string;
  readingTimeMinutes?: number;
  tags?: string[];
};

interface Props {
  posts: Post[];
  id?: string;
  /** Disable the prose typography wrapper for full-width layout */
  noProse?: boolean;
  lang?: string;
  /** Thumbnail size variant for the preview image */
  thumbnailVariant?: "default" | "compact";
  /** Title size variant */
  titleVariant?: "default" | "compact";
}

const formatReadingTime = (minutes: number, lang?: string): string => {
  const n = formatNumber(minutes, lang || DEFAULT_LANG, { maximumFractionDigits: 0 });
  return t("post.reading_time", lang || DEFAULT_LANG).replace("{minutes}", String(n));
};

const PostListReact: React.FC<Props> = ({ posts, id, noProse = false, lang, thumbnailVariant = "default", titleVariant = "default" }) => {
  const rootClass = ["space-y-4", "mt-6", !noProse && "prose dark:prose-invert"]
    .filter(Boolean)
    .join(" ");
  const titleClass = titleVariant === "compact" ? "not-prose text-content font-medium mb-1" : "not-prose post-list-title mb-1";

  return (
    <div id={id} className={rootClass}>
      {posts.map((post) => (
        <div key={post.slug} className="mb-8 flex flex-col items-start gap-4 sm:flex-row">
          {post.ogImage && (
            <a
              href={postPath(lang ?? DEFAULT_LANG, post.slug)}
              className="not-prose block flex-shrink-0 self-center pt-2 leading-none sm:self-start"
            >
              <img
                src={
                  typeof post.ogImage === "object" && post.ogImage
                    ? (post.ogImage as { src: string }).src
                    : post.ogImage
                }
                alt={post.title}
                className={`${thumbnailVariant === "compact" ? "h-12 w-12" : "h-30 w-30"} rounded object-cover`}
              />
            </a>
          )}
          <div>
            <a
              href={postPath(lang ?? DEFAULT_LANG, post.slug)}
              className={titleClass}
            >
              {post.title}
            </a>
            {post.date && (
              <p className="text-muted-content/60 mt-[5px] flex items-center gap-1 text-sm">
                <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" />
                {formatLongDate(new Date(post.date), lang)} •{" "}
                {post.readingTimeMinutes ? formatReadingTime(post.readingTimeMinutes, lang) : ""}
              </p>
            )}
            <p className="prose-lg text-muted-content text-justify sm:text-left">
              {(post.description ?? excerpt(post.body ?? "")).slice(0, 160)}{(post.description ?? excerpt(post.body ?? "")).length > 160 ? "…" : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostListReact;

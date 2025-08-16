/** @jsxImportSource react */
import Fuse from "fuse.js";
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

import { DEFAULT_LANG } from "../config.i18n";
import { t } from "../i18n";
import { isNonEmptyString } from "../utils/validate";
import { postPath } from "../utils/urls";
import type { Post } from "./PostListReact";
import { loadSearch } from "../services/SearchIndexClient";

interface SearchIslandProps {
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** Language code for prefixed routes */
  lang?: string;
  /** Pre-fetched recent posts for initial render */
  initial?: Post[];
}

export default function SearchIsland({ autoFocus = false, lang, initial: _initial = [] }: SearchIslandProps) {
  // Initialize query from URL (client-side only)
  const [query, setQuery] = React.useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    return isNonEmptyString(q) ? q : "";
  });
  const [fuse, setFuse] = React.useState<Fuse<Post> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const language = lang || DEFAULT_LANG;
        const { fuse } = await loadSearch(language, DEFAULT_LANG);
        setFuse(fuse);
      } catch (err) {
        console.error("Failed to load search data", err);
        setError(t("search.error", lang || DEFAULT_LANG));
      }
    })();
  }, [lang]);

  // Keep URL in sync whenever query changes so results page can be bookmarked / shared.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set("q", query.trim());
    } else {
      url.searchParams.delete("q");
    }
    // Replace the current history entry instead of pushing to avoid polluting back stack per keystroke.
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, [query]);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    if (!fuse) return [];
    return fuse.search(query.trim()).map((r) => r.item);
  }, [query, fuse]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus management
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // '/' shortcut – common on docs sites to jump to search quickly
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing inside input/textarea/select or when modifier keys pressed
      const tagName = (e.target as HTMLElement | null)?.tagName || "";
      const isInputElement = /INPUT|TEXTAREA|SELECT/.test(tagName);
      if (isInputElement || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div role="search" aria-label={t("page.search", lang || DEFAULT_LANG)}>
      <div className="mb-4">
        <label htmlFor="search-input" className="sr-only">
          {t("search.title", lang || DEFAULT_LANG)}
        </label>
        <div className="border-muted bg-surface flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-muted-content h-5 w-5" />
          <input
            id="search-input"
            ref={inputRef}
            type="search"
            placeholder={t("search.placeholder", lang || DEFAULT_LANG)}
            className="text-content placeholder:text-muted-content w-full bg-transparent focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls="results"
          />
          {query && (
            <button
              type="button"
              className="hover:bg-muted rounded p-1 focus:ring-primary focus:ring-2 focus:outline-none"
              aria-label={t("action.clear", lang || DEFAULT_LANG)}
              onClick={() => setQuery("")}
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
          )}
        </div>
        {!query && (
          <p id="search-hint" className="text-muted-content mt-2 text-sm">
            {t("search.hint", lang || DEFAULT_LANG)}
          </p>
        )}
      </div>

      {error ? (
        <p className="text-muted-content text-sm">{error}</p>
      ) : query.trim() ? (
        results.length ? (
          <div className="text-left">
            <p className="subtitle mb-2">
              {t("search.results_count", lang || DEFAULT_LANG).replace("{count}", String(results.length))}
            </p>
            <ul id="results" className="divide-muted divide-y list-none pl-0">
              {results.map((post) => (
                <li key={post.slug}>
                  <a
                    href={postPath(lang || DEFAULT_LANG, post.slug)}
                    className="group flex items-center gap-3 rounded px-3 py-2 no-underline hover:no-underline hover:bg-muted"
                  >
                    {post.ogImage ? (
                      <img
                        src={
                          typeof post.ogImage === "object" && post.ogImage
                            ? (post.ogImage as { src: string }).src
                            : post.ogImage
                        }
                        alt={post.title}
                        className="h-12 w-12 flex-shrink-0 rounded object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="bg-muted h-12 w-12 flex-shrink-0 rounded" />
                    )}
                    <div className="min-w-0">
                      <div className="text-content truncate font-medium group-hover:underline">
                        {post.title}
                      </div>
                      {post.description && (
                        <div className="text-muted-content line-clamp-2 text-sm">
                          {post.description}
                        </div>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-content">{t("search.no_results", lang || DEFAULT_LANG)}</p>
        )
      ) : null}
    </div>
  );
}

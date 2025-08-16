/** @jsxImportSource react */
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Fuse from "fuse.js";
import * as React from "react";

import { DEFAULT_LANG } from "../config.i18n";
import { t } from "../i18n";
import { loadSearch } from "../services/SearchIndexClient";
import { postPath } from "../utils/urls";
import { isNonEmptyString } from "../utils/validate";
import type { Post } from "./PostListReact";

interface SearchOverlayProps {
  lang?: string;
}

export default function SearchOverlay({ lang }: SearchOverlayProps) {
  const language = lang || DEFAULT_LANG;
  const pathPrefix = language !== DEFAULT_LANG ? `/${language}` : "";

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [fuse, setFuse] = React.useState<Fuse<Post> | null>(null);
  const [_allData, _setAllData] = React.useState<Post[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [animOpen, setAnimOpen] = React.useState(false);
  const [closing, setClosing] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const lastActiveRef = React.useRef<HTMLElement | null>(null);

  const ensureLoaded = React.useCallback(async () => {
    if (loaded && fuse) return;
    try {
      const { fuse: f } = await loadSearch(language, DEFAULT_LANG);
      setFuse(f);
      setLoaded(true);
    } catch {
      // ignore – overlay will just show no results
    }
  }, [loaded, fuse, language]);

  // Lazy-load index when first opened
  React.useEffect(() => {
    if (!open || loaded) return;
    ensureLoaded();
  }, [open, loaded, ensureLoaded]);

  // Focus input when opening
  React.useEffect(() => {
    if (open) {
      // Slight delay to ensure element is visible
      setTimeout(() => {
        setAnimOpen(true);
        inputRef.current?.focus();
      }, 0);
      // Remember the previously focused element
      lastActiveRef.current = (document.activeElement as HTMLElement) || null;
    } else {
      setQuery("");
      setAnimOpen(false);
      setClosing(false);
    }
  }, [open]);

  // Restore focus to trigger when closing
  React.useEffect(() => {
    if (!open && lastActiveRef.current) {
      try {
        lastActiveRef.current.focus();
      } catch {
        /* ignore */
      }
    }
  }, [open]);

  // Prevent background scroll while dialog is open
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Keyboard shortcuts to open (⌘K / Ctrl+K or '/')
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName || "";
      const isTyping =
        /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target as HTMLElement | null)?.isContentEditable;
      if (isTyping) return;
      const isCmdK = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      const isSlash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      if (isCmdK || isSlash) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Custom event from header buttons
  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-search", onOpen);
    return () => window.removeEventListener("open-search", onOpen);
  }, []);

  // Expose readiness flag so header can decide whether to intercept link
  React.useEffect(() => {
    try {
      (window as unknown as { __searchOverlayReady?: boolean }).__searchOverlayReady = true;
      return () => {
        try {
          delete (window as unknown as { __searchOverlayReady?: boolean }).__searchOverlayReady;
        } catch {
          /* ignore */
        }
      };
    } catch {
      return;
    }
  }, []);

  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const results = React.useMemo(() => {
    if (!isNonEmptyString(query) || !fuse) return [] as Post[];
    return fuse
      .search(query.trim())
      .map((r) => r.item)
      .slice(0, 10);
  }, [query, fuse]);

  const navigateToFullSearch = React.useCallback(() => {
    const q = query.trim();
    const url = `${pathPrefix}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    window.location.assign(url);
  }, [pathPrefix, query]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        window.location.assign(postPath(language, results[activeIndex].slug));
      } else {
        navigateToFullSearch();
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }
  };

  // Simple focus trap within the dialog
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      const elements = Array.from(focusables).filter((el) => !el.hasAttribute("disabled"));
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const beginClose = React.useCallback(() => {
    setAnimOpen(false);
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }, []);

  const _recentPosts = React.useMemo(() => [] as Post[], []);

  if (!open && !closing) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 sm:p-8 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label={t("page.search", language)}
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-150 ease-out dark:bg-black/80 ${animOpen ? "opacity-100" : "opacity-0"}`}
        onClick={beginClose}
      />
      <div
        ref={dialogRef}
        className={`border-muted bg-surface relative z-[101] w-full max-w-5xl rounded-lg border shadow-lg transition-all duration-150 ease-out ${animOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"}`}
      >
        <div className="px-4 pt-4">
          <h2 className="not-prose text-content quiet-bold mb-2 text-lg">
            {t("search.title", language)}
          </h2>
          <div className="border-muted bg-surface focus-within:ring-primary flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm focus-within:ring-2">
            <label htmlFor="overlay-search-input" className="sr-only">
              {t("search.title", language)}
            </label>
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-muted-content h-5 w-5" />
            <input
              id="overlay-search-input"
              ref={inputRef}
              type="search"
              placeholder={t("search.placeholder", language)}
              className="search-input text-content placeholder:text-muted-content w-full appearance-none bg-transparent focus:ring-0 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              aria-controls="overlay-results"
            />
            {query && (
              <button
                type="button"
                aria-label={t("action.clear", language)}
                className="hover:bg-muted focus:ring-primary rounded p-1 focus:ring-2 focus:outline-none"
                onClick={() => setQuery("")}
              >
                <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          {isNonEmptyString(query) ? (
            results.length ? (
              <>
                <div className="subtitle px-3 pb-2">
                  {t("search.results_count", language).replace("{count}", String(results.length))}
                </div>
                <ul id="overlay-results" className="divide-muted divide-y">
                  {results.map((post, idx) => (
                    <li key={post.slug}>
                      <a
                        href={postPath(language, post.slug)}
                        className={`group flex items-center gap-3 rounded px-3 py-2 no-underline hover:no-underline ${idx === activeIndex ? "bg-muted" : "hover:bg-muted"}`}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        {post.ogImage ? (
                          <img
                            src={
                              typeof post.ogImage === "object"
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
              </>
            ) : (
              <div className="text-muted-content px-3 py-6 text-sm">
                {t("search.no_results", language)}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

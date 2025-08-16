import { SITE } from "../config";
import { DEFAULT_LANG, SUPPORTED_LANGS } from "../config.i18n";

export function resolveLangFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  return SUPPORTED_LANGS.some((l) => l.code === first) ? first : DEFAULT_LANG;
}

export function langPrefix(lang: string): string {
  return lang === DEFAULT_LANG ? "" : `/${lang}`;
}

export function stripLeadingLang(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (SUPPORTED_LANGS.some((l) => l.code === parts[0])) {
    const rest = "/" + parts.slice(1).join("/");
    return rest.endsWith("/") ? rest : rest + "/";
  }
  return pathname.endsWith("/") ? pathname : pathname + "/";
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const withSlash = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return SITE.site + withSlash;
}

export function canonicalHref(canonicalProp: string | undefined, pathname: string): string {
  if (canonicalProp) return absoluteUrl(canonicalProp);
  return absoluteUrl(pathname);
}

export function hrefForLang(pathname: string, langCode: string): string {
  const withoutLang = stripLeadingLang(pathname);
  const href = `${langPrefix(langCode)}${withoutLang}` || "/";
  return absoluteUrl(href || "/");
}

export function pathWithLang(langCode: string, path: string): string {
  const base = path.startsWith("/") ? path : `/${path}`;
  return `${langPrefix(langCode)}${base}` || "/";
}

export function postPath(langCode: string, slug: string): string {
  return pathWithLang(langCode, `/posts/${slug}/`);
}

export function tagPath(langCode: string, tag: string): string {
  return pathWithLang(langCode, `/posts/tag/${encodeURIComponent(tag)}/`);
}

export function pagePath(langCode: string, page: number): string {
  return pathWithLang(langCode, `/page/${page}/`);
}

export function indexPath(langCode: string): string {
  const p = langPrefix(langCode);
  return p === "" ? "/" : `${p}/`;
}

export const DEFAULT_LANG = "en";

export const SUPPORTED_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const;

export type LangCode = (typeof SUPPORTED_LANGS)[number]["code"];

export function isSupportedLang(lang: string): lang is LangCode {
  return SUPPORTED_LANGS.some((l) => l.code === lang);
}

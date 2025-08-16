import { DEFAULT_LANG, SUPPORTED_LANGS } from "../config.i18n";

// Eagerly import all JSON files in this directory (e.g. ./en.json, ./es.json)
// Vite/ Astro will bundle these at build-time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localeModules = (import.meta as any).glob("./*.json", {
  eager: true,
}) as Record<string, { default: Record<string, string> }>;

// Build dictionary map from file names (e.g. './en.json' → 'en')
const dictionaries: Record<string, Record<string, string>> = {};

for (const [path, mod] of Object.entries(localeModules)) {
  const match = /\.\/([a-z-]+)\.json$/i.exec(path);
  if (!match) continue;
  const langCode = match[1];
  dictionaries[langCode] = mod.default;
}

// Ensure every supported language has an entry (even if empty)
for (const { code } of SUPPORTED_LANGS) {
  if (!dictionaries[code]) {
    dictionaries[code] = {};
  }
}

export function t(key: string, lang: string = DEFAULT_LANG): string {
  return dictionaries[lang]?.[key] ?? dictionaries[DEFAULT_LANG]?.[key] ?? key;
}

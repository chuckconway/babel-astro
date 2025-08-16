import readingTime from "reading-time";

import { t } from "../i18n";

export function getReadingTime(text: string, lang?: string): string {
  const result = readingTime(text);
  return t("post.reading_time", lang).replace("{minutes}", String(Math.ceil(result.minutes)));
}

export function getReadingTimeMinutes(text: string): number {
  return Math.ceil(readingTime(text).minutes);
}

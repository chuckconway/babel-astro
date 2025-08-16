export function formatNumber(
  value: number,
  lang = "en",
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(lang, options).format(value);
}

export function formatCompactNumber(value: number, lang = "en"): string {
  return new Intl.NumberFormat(lang, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatBytes(bytes: number, lang = "en", decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: decimals }).format(value)} ${sizes[i]}`;
}

export function formatShortDate(date: Date | string | number, lang = "en"): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(d);
}

export function formatTime(date: Date | string | number, lang = "en"): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang, { timeStyle: "short" }).format(d);
}

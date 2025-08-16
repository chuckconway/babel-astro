export const formatLongDate = (date: Date | number | string, lang?: string): string => {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang || "en", { dateStyle: "long" }).format(d);
};

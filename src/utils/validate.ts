import { AppError, invariant } from "./errors";

export function isDefined<T>(value: T | null | undefined): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function assertDefined<T>(
  value: T | null | undefined,
  name = "value",
): asserts value is NonNullable<T> {
  invariant(isDefined(value), `${name} must be defined`);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function ensureNonEmptyString(value: unknown, name = "value"): string {
  if (!isNonEmptyString(value)) {
    throw new AppError(`${name} must be a non-empty string`, { code: "VALIDATION" });
  }
  return value.trim();
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function ensurePositiveInteger(value: unknown, name = "value"): number {
  if (!isPositiveInteger(value)) {
    throw new AppError(`${name} must be a positive integer`, { code: "VALIDATION" });
  }
  return value;
}

export function isUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function ensureUrl(value: unknown, name = "url"): string {
  if (!isUrl(value)) {
    throw new AppError(`${name} must be a valid URL`, { code: "VALIDATION" });
  }
  return value;
}

export function notEmptyArray<T>(arr: T[] | null | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function safeJsonParse<T>(
  text: string,
): { ok: true; value: T } | { ok: false; error: AppError } {
  try {
    const value = JSON.parse(text) as T;
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: new AppError("Invalid JSON", { cause: err }) };
  }
}

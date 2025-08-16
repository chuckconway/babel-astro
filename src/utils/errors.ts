export class AppError extends Error {
  readonly code?: string;
  readonly cause?: unknown;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.code = options?.code;
    this.cause = options?.cause;
  }
}

export function errorFromUnknown(err: unknown, fallbackMessage = "Unexpected error"): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError(err.message, { cause: err });
  if (typeof err === "string") return new AppError(err);
  return new AppError(fallbackMessage, { cause: err });
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new AppError(message, { code: "INVARIANT" });
  }
}

export function logError(context: string, err: unknown): void {
  // Central place to hook structured logging later
  console.error(`[${context}]`, err);
}

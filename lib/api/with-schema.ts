/**
 * lib/api/with-schema.ts
 *
 * Parses and validates the JSON request body using a validator function.
 * On success, injects `body: T` into ctx. Throws ValidationError (→ 400)
 * on invalid JSON or validation failure.
 *
 * The validator should throw a ValidationError (or return the typed value).
 * Use the built-in helpers below or write your own.
 *
 * Usage:
 *   import { withSchema, requireFields } from "@/lib/api/with-schema";
 *
 *   const LoginSchema = (raw: unknown) => requireFields(raw, {
 *     email:    (v) => typeof v === "string" && v.includes("@") ? v.trim().toLowerCase() : null,
 *     password: (v) => typeof v === "string" && v.length >= 1  ? v : null,
 *   });
 *
 *   export const POST = compose(withErrorHandler, withMethods(["POST"]), withSchema(LoginSchema))(
 *     async (req, { body: { email, password } }) => { ... }
 *   );
 */

import { NextRequest } from "next/server";
import { ValidationError } from "./errors";
import type { AnyHandler } from "./compose";

export type Validator<T> = (raw: unknown) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSchema<T>(validate: Validator<T>): (handler: any) => AnyHandler {
  return (handler: AnyHandler): AnyHandler => {
    return async (req: NextRequest, ctx: unknown): Promise<Response> => {
      let raw: unknown;
      try {
        raw = await req.json();
      } catch {
        throw new ValidationError("Request body must be valid JSON");
      }
      const body = validate(raw);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return handler(req, { ...(ctx as any), body });
    };
  };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

type FieldParser<T> = (value: unknown) => T | null;
type FieldParsers<T> = { [K in keyof T]: FieldParser<T[K]> };

/**
 * Validates an object against a map of field parsers.
 * Each parser returns the value or null on failure.
 * Throws ValidationError listing all invalid fields.
 */
export function requireFields<T extends Record<string, unknown>>(
  raw: unknown,
  parsers: FieldParsers<T>,
): T {
  if (typeof raw !== "object" || raw === null) {
    throw new ValidationError("Request body must be a JSON object");
  }
  const obj = raw as Record<string, unknown>;
  const result: Partial<T> = {};
  const errors: Record<string, string> = {};

  for (const key of Object.keys(parsers) as (keyof T & string)[]) {
    const parsed = parsers[key](obj[key]);
    if (parsed === null || parsed === undefined) {
      errors[key] = "invalid or missing";
    } else {
      result[key] = parsed as T[typeof key];
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
  return result as T;
}

/** Parse a non-empty trimmed string field. */
export function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return null;
}

/** Parse an optional string (undefined if missing/null, null on empty). */
export function optStr(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v.trim() || null;
  return null;
}

/** Parse a valid email address (lowercase, trimmed). */
export function email(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

/** Parse a password with minimum length. */
export function password(minLen = 8) {
  return (v: unknown): string | null => {
    if (typeof v === "string" && v.length >= minLen) return v;
    return null;
  };
}

/**
 * Thin JSON wrapper over fetch. Every endpoint module goes through this so
 * error semantics are decided in ONE place: successful 2xx yields the parsed
 * body (204 yields undefined), and anything else throws ApiError carrying
 * the status and whatever body the server sent (JSON or not).
 */

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Only claims a Content-Type when there is actually a body (GET/DELETE must
  // not pretend to send JSON).
  const headers = new Headers(init.headers);
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });

  // 204 No Content is a success with no body BY DEFINITION — callers use
  // apiFetch<void> and must not expect data.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let body: unknown = null;
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      // Non-JSON error pages (proxy 500s, html) still reach error handling.
      body = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body as T;
}

/** Flattens a DRF-style error body ("title":"...", "settings": {sub}) into
 * one field error string so dialogs can render them next to fields. */
export type FieldErrors = Record<string, string>;

export function readFieldErrors(body: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (typeof body !== "object" || body === null) {
    return out;
  }
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value.filter((item): item is string => typeof item === "string").join(" ");
    } else if (typeof value === "object" && value !== null) {
      for (const [subKey, subValue] of Object.entries(value)) {
        if (Array.isArray(subValue)) {
          out[`${key}.${subKey}`] = subValue
            .filter((item): item is string => typeof item === "string")
            .join(" ");
        } else if (typeof subValue === "string") {
          out[`${key}.${subKey}`] = subValue;
        }
      }
    }
  }
  return out;
}

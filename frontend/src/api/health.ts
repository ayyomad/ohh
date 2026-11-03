/**
 * Typed client for the backend health endpoint (apps.core.views.HealthView).
 *
 * The backend answers 200 {"status":"ok",...} or 503 {"status":"degraded",...};
 * a 503 is an expected app state, not an error, and still carries the JSON
 * body — so both cases are parsed here and surfaced to the UI as the state,
 * while anything unexpected (bad payload, different status) throws and
 * renders to "unreachable" instead of silently misinforming the user.
 */

export type HealthState = "ok" | "degraded";
export type HealthDatabase = "ok" | "error";

export interface HealthResponse {
  status: HealthState;
  database: HealthDatabase;
  version: string;
}

export interface HealthOutcome {
  state: HealthState;
  version: string;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    (record.status === "ok" || record.status === "degraded") &&
    (record.database === "ok" || record.database === "error") &&
    typeof record.version === "string"
  );
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthOutcome> {
  const response = await fetch("/api/v1/health/", {
    signal,
    headers: { Accept: "application/json" },
  });
  // Read the body first: 503 responses are valid health payloads.
  const body: unknown = await response.json();
  if (!isHealthResponse(body)) {
    throw new Error("Unrecognised health payload");
  }
  if (response.ok && body.status !== "ok") {
    throw new Error(`Got ok response with inconsistent body ${body.status}`);
  }
  if (!response.ok && response.status !== 503) {
    throw new Error(`Unexpected health status ${response.status}`);
  }
  if (!response.ok && body.status !== "degraded") {
    throw new Error(`Got 503 response with inconsistent body ${body.status}`);
  }
  return { state: body.status, version: body.version };
}

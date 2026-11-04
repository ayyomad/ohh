/**
 * Typed client for the boards API (/api/v1/boards/).
 *
 * Pagination rule (docs/API_DESIGN.md + prompt): NEVER follow the `next`
 * URL. We always build requests from the base path plus ?page=N, and read
 * `next !== null` purely as a "has more" flag — a changed/rewritten next URL
 * can then never drift us off the proxy path.
 */

import { apiFetch } from "./client";

const BASE_PATH = "/api/v1/boards/";

export type BoardAppearance = "light" | "dark";
export type BoardBackground = "plain" | "grid" | "dots";

export interface BoardSettings {
  appearance: BoardAppearance;
  background: BoardBackground;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  settings: BoardSettings;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BoardInput {
  title: string;
  description?: string;
  settings?: BoardSettings;
}

export interface ListBoardsArgs {
  search?: string;
  page?: number;
  signal?: AbortSignal;
}

export function listBoards({
  search,
  page,
  signal,
}: ListBoardsArgs): Promise<Paginated<Board>> {
  const params = new URLSearchParams();
  if (search !== undefined && search.trim() !== "") {
    params.set("search", search);
  }
  if (page !== undefined && page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return apiFetch<Paginated<Board>>(
    query === "" ? BASE_PATH : `${BASE_PATH}?${query}`,
    { signal }
  );
}

export function createBoard(input: BoardInput, signal?: AbortSignal): Promise<Board> {
  return apiFetch<Board>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export function updateBoard(
  id: string,
  patch: Partial<BoardInput>,
  signal?: AbortSignal
): Promise<Board> {
  return apiFetch<Board>(`${BASE_PATH}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    signal,
  });
}

export function deleteBoard(id: string, signal?: AbortSignal): Promise<void> {
  return apiFetch<void>(`${BASE_PATH}${id}/`, { method: "DELETE", signal });
}

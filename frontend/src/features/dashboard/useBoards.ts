/**
 * TanStack Query hooks for boards.
 *
 * LOAD MORE must APPEND, not replace: useInfiniteQuery keyed by
 * ["boards", { search }], pages built from ?page=N. The API's `next` URL is
 * never parsed or followed — `next !== null` is read purely as a "there is
 * another page" flag (docs/API_DESIGN.md). keepPreviousData keeps the current
 * grid on screen (dimmed, aria-busy) while a new search loads, so typing
 * never replaces it with LOADING; LOADING shows only for an empty cache.
 *
 * Mutations invalidate ALL boards queries (prefix "boards") so every visible
 * page regains truth after a create/update/delete.
 */

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  type BoardInput,
  createBoard,
  deleteBoard,
  listBoards,
  updateBoard,
} from "../../api/boards";

const BOARDS_KEY = "boards";

export function useBoards(search: string) {
  return useInfiniteQuery({
    queryKey: [BOARDS_KEY, { search }],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      listBoards({ search: search === "" ? undefined : search, page: pageParam, signal }),
    // Page N+1 exists whenever the API still has rows; page numbers are
    // positions in our own request series, never parsed out of `next`.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next !== null ? allPages.length + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}

function invalidateBoards(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: [BOARDS_KEY] });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BoardInput) => createBoard(input),
    onSuccess: () => invalidateBoards(queryClient),
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BoardInput> }) =>
      updateBoard(id, patch),
    onSuccess: () => invalidateBoards(queryClient),
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBoard(id),
    onSuccess: () => invalidateBoards(queryClient),
  });
}

/**
 * The dashboard. Owns: debounced search, infinite list query, dialogs and
 * their success/error flows. Components stay small; this file is the wiring.
 */

import { useState } from "react";
import { ApiError, type FieldErrors, readFieldErrors } from "../../api/client";
import type { Board, BoardInput } from "../../api/boards";
import { BackendStatus } from "./BackendStatus";
import { BoardTile } from "./BoardTile";
import { BoardThumbnail } from "./BoardThumbnail";
import { BoardFormDialog } from "./BoardFormDialog";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useDebouncedValue } from "./useDebouncedValue";
import { useBoards, useCreateBoard, useDeleteBoard, useUpdateBoard } from "./useBoards";
import { useTheme } from "../../theme";

type FormTarget = { mode: "create" } | { mode: "edit"; board: Board };

const NO_ERRORS: FieldErrors = {};

const SEARCH_INPUT_CLASS =
  "bg-surface border-[1.5px] border-line rounded px-4 py-2.5 font-mono text-xs uppercase tracking-widest w-72 placeholder:text-muted focus:border-ink focus:outline-none";

export function DashboardPage(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), 200);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Board | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [formErrors, setFormErrors] = useState<FieldErrors>(NO_ERRORS);

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setSearchInput(event.target.value);
  }

  const boards = useBoards(search);
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  function closeFormDialog(): void {
    setFormTarget(null);
    setFormErrors(NO_ERRORS);
  }

  async function handleFormSubmit(input: BoardInput): Promise<void> {
    setFormErrors(NO_ERRORS);
    try {
      if (formTarget?.mode === "edit") {
        // PATCH what actually changed: keeps the payload honest and makes
        // edits visible, field by field, in the request.
        const board = formTarget.board;
        const patch: Partial<BoardInput> = {};
        if (input.title !== board.title) {
          patch.title = input.title;
        }
        if (input.description !== board.description) {
          patch.description = input.description;
        }
        if (
          (input.settings?.appearance ?? null) !== board.settings.appearance ||
          (input.settings?.background ?? null) !== board.settings.background
        ) {
          patch.settings = input.settings;
        }
        await updateBoard.mutateAsync({ id: board.id, patch });
      } else {
        await createBoard.mutateAsync(input);
      }
      closeFormDialog();
    } catch (error) {
      // A field 400 reaches the dialog (role=alert) WITHOUT closing it, so
      // the user's input survives. Anything else reads as unreachable.
      const parsed = readFieldErrors(error instanceof ApiError ? error.body : null);
      setFormErrors(
        Object.keys(parsed).length > 0 ? parsed : { detail: "COULD NOT REACH THE SERVER" }
      );
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (confirmTarget === null) {
      return;
    }
    try {
      await deleteBoard.mutateAsync(confirmTarget.id);
      setConfirmTarget(null);
      setDeleteError(false);
    } catch {
      // The dialog STAYS OPEN with a role=alert: silently closing it would
      // read as "deleted" while the board survives (the list does not change).
      setDeleteError(true);
    }
  }

  // All pages flattened, oldest first: LOAD MORE appends, it never replaces.
  const pages = boards.data?.pages ?? [];
  const results = pages.flatMap((page) => page.results);
  const hasResults = results.length > 0;
  const featuredIndex = search === "" ? 0 : -1;

  return (
    <main className="min-h-screen bg-ground text-ink font-sans">
      <div className="mx-auto max-w-[1200px] px-8 py-10 flex flex-col min-h-screen">
        <header className="flex items-end justify-between gap-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              OHh<span className="text-accent">.</span>
            </h1>
            <div className="mt-6 flex items-baseline gap-3">
              <p className="font-mono text-5xl tabular-nums" aria-label="Board count">
                {pages[0]?.count ?? "—"}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                BOARDS
              </p>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div>
              <label htmlFor="board-search" className="sr-only">
                SEARCH BOARDS
              </label>
              <input
                id="board-search"
                type="search"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="SEARCH BOARDS"
                className={SEARCH_INPUT_CLASS}
              />
            </div>
            <button
              type="button"
              onClick={() => setFormTarget({ mode: "create" })}
              className="bg-accent text-ink font-mono text-xs uppercase tracking-widest rounded px-5 py-2.5 whitespace-nowrap"
            >
              NEW BOARD
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              className="font-mono text-xs uppercase tracking-widest border-[1.5px] border-ink rounded px-3 py-2.5 hover:bg-surface-2 whitespace-nowrap"
            >
              {theme === "light" ? "DARK" : "LIGHT"}
            </button>
          </div>
        </header>

        <div className="mt-10 flex-1">
          {boards.isPending && (
            <p className="font-mono text-sm uppercase tracking-widest text-muted">
              LOADING
            </p>
          )}

          {boards.isError && (
            <div role="alert" className="flex items-center gap-6">
              <p className="font-mono text-sm uppercase tracking-widest text-accent-text">
                COULD NOT LOAD BOARDS
              </p>
              <button
                type="button"
                onClick={() => void boards.refetch()}
                className="font-mono text-xs uppercase tracking-widest border-[1.5px] border-ink rounded px-4 py-2 hover:bg-surface-2"
              >
                RETRY
              </button>
            </div>
          )}

          {boards.data !== undefined && !hasResults && search === "" && (
            <div className="border-[1.5px] border-ink rounded-xl bg-surface p-10 flex flex-col items-center gap-6 max-w-md mx-auto">
              <div className="h-40 w-full rounded-lg overflow-hidden border-[1.5px] border-line">
                <BoardThumbnail id="empty-state" />
              </div>
              <p className="font-serif italic text-lg">
                an empty table. start something.
              </p>
              <button
                type="button"
                onClick={() => setFormTarget({ mode: "create" })}
                className="bg-accent text-ink font-mono text-xs uppercase tracking-widest rounded px-5 py-2.5"
              >
                NEW BOARD
              </button>
            </div>
          )}

          {boards.data !== undefined && !hasResults && search !== "" && (
            <p
              role="status"
              className="font-mono text-sm uppercase tracking-widest text-muted"
            >
              NO RESULTS FOR “{search}”
            </p>
          )}

          {hasResults && (
            <>
              <div
                aria-busy={boards.isPlaceholderData}
                className={`grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 ${
                  boards.isPlaceholderData ? "opacity-60" : ""
                }`}
              >
                {results.map((board, index) => (
                  <BoardTile
                    key={board.id}
                    board={board}
                    featured={index === featuredIndex}
                    onSettings={() => setFormTarget({ mode: "edit", board })}
                    onDelete={() => {
                      setDeleteError(false);
                      setConfirmTarget(board);
                    }}
                  />
                ))}
              </div>
              {boards.hasNextPage && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void boards.fetchNextPage()}
                    disabled={boards.isFetchingNextPage}
                    className="font-mono text-xs uppercase tracking-widest border-[1.5px] border-ink rounded px-6 py-3 hover:bg-surface-2"
                  >
                    {boards.isFetchingNextPage ? "LOADING" : "LOAD MORE"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="mt-12">
          <BackendStatus />
        </footer>
      </div>

      {formTarget !== null && (
        // Mounted ONLY while open (like ConfirmDeleteDialog), keyed by mode
        // plus board id: the blank create form is state in the component, so
        // remounting is what keeps NEW BOARD from reopening stale values.
        <BoardFormDialog
          key={formTarget.mode === "edit" ? formTarget.board.id : "create"}
          board={formTarget.mode === "edit" ? formTarget.board : null}
          pending={createBoard.isPending || updateBoard.isPending}
          errors={formErrors}
          onSubmit={(input) => void handleFormSubmit(input)}
          onClose={closeFormDialog}
        />
      )}

      {confirmTarget !== null && (
        <ConfirmDeleteDialog
          open={confirmTarget !== null}
          board={confirmTarget}
          pending={deleteBoard.isPending}
          error={deleteError}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </main>
  );
}

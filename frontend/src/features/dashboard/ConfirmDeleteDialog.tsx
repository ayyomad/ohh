/**
 * Confirm dialog for soft-deleting a board. The displayed title is the only
 * thing standing between the user and a deleted board, so it is prominent;
 * CANCEL sends nothing at all.
 */

import { useEffect, useRef } from "react";
import type { Board } from "../../api/boards";

interface ConfirmDeleteDialogProps {
  open: boolean;
  board: Board;
  pending: boolean;
  /** true when the DELETE request failed: keep the dialog open and warn. */
  error: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({
  open,
  board,
  pending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      aria-labelledby="confirm-delete-dialog-title"
      className="bg-surface text-ink border-[1.5px] border-ink rounded-xl p-8 w-md m-auto"
    >
      <h2
        id="confirm-delete-dialog-title"
        className="text-xl font-semibold mb-4"
      >
        DELETE BOARD?
      </h2>
      <p className="text-sm text-muted mb-8">
        “{board.title}” will disappear from the table. For now deletes are
        soft on the server, so a restore is still possible later.
      </p>
      {error && (
        <p
          role="alert"
          className="font-mono text-xs uppercase tracking-widest text-accent-text -mt-4 mb-4"
        >
          COULD NOT DELETE
        </p>
      )}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-xs uppercase tracking-widest hover:text-accent-text"
        >
          CANCEL
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="bg-accent text-ink font-mono text-xs uppercase tracking-widest rounded px-5 py-2.5 disabled:opacity-60"
        >
          DELETE
        </button>
      </div>
    </dialog>
  );
}

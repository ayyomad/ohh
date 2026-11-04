/**
 * Create-or-edit board dialog on the native <dialog> element (built-in focus
 * trap, Esc-to-close via the `onClose` event). Owns the raw fields; the
 * parent decides what to submit and only closes on success — a 400 stays
 * visible here (role=alert) without losing the user's input.
 */

import { useEffect, useRef, useState } from "react";
import type {
  Board,
  BoardAppearance,
  BoardBackground,
  BoardInput,
} from "../../api/boards";
import type { FieldErrors } from "../../api/client";

interface BoardFormDialogProps {
  /** null = create mode */
  board: Board | null;
  pending: boolean;
  errors: FieldErrors | null;
  onSubmit: (input: BoardInput) => void;
  onClose: () => void;
}

/** Styling only; needs the sr-only input to receive the focus to be visible. */
const SEGMENT_LABEL_CLASS =
  "px-3 py-1.5 font-mono text-xs uppercase tracking-widest cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink has-[:focus-visible]:outline-offset-2";

function Segment({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}): React.JSX.Element {
  return (
    <fieldset className="flex items-center gap-3">
      <legend className="font-mono text-xs uppercase tracking-widest text-muted">
        {legend}
      </legend>
      {/* A plain radio group: keyboard behaviour comes for free, styling is
          only the sr-only input + the selected pill showing the accent. The
          focused-but-unselected label still shows a visible focus outline. */}
      <div className="flex border-[1.5px] border-line rounded overflow-hidden">
        {options.map((option) => (
          <label
            key={option.value}
            className={`${SEGMENT_LABEL_CLASS} ${
              value === option.value
                ? "bg-accent text-ink"
                : "text-muted hover:bg-surface-2"
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const TEXT_FIELD_CLASS =
  "bg-surface border-[1.5px] border-line rounded px-3 py-2 text-sm w-full focus:border-ink focus:outline-none";

export function BoardFormDialog({
  board,
  pending,
  errors,
  onSubmit,
  onClose,
}: BoardFormDialogProps): React.JSX.Element {
  const [title, setTitle] = useState(board?.title ?? "");
  const [description, setDescription] = useState(board?.description ?? "");
  const [appearance, setAppearance] = useState<BoardAppearance>(
    board?.settings.appearance ?? "light"
  );
  const [background, setBackground] = useState<BoardBackground>(
    board?.settings.background ?? "dots"
  );
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // The parent mounts this component only while the dialog should be open,
  // so mounting == showing. Closing (CANCEL, Esc, the browser close event)
  // fires onClose, which unmounts it again.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    // Titles are stored trimmed (backend rule); we submit the trimmed value
    // so whitespace can never be the whole title.
    onSubmit({
      title: title.trim(),
      description,
      settings: { appearance, background },
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="board-form-dialog-title"
      className="bg-surface text-ink border-[1.5px] border-ink rounded-xl p-8 w-md m-auto"
    >
      <h2
        id="board-form-dialog-title"
        className="text-xl font-semibold mb-6"
      >
        {board === null ? "NEW BOARD" : "BOARD SETTINGS"}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div>
          <label
            htmlFor="board-title"
            className="block font-mono text-xs uppercase tracking-widest text-muted mb-1"
          >
            TITLE
          </label>
          <input
            id="board-title"
            className={TEXT_FIELD_CLASS}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />
          {errors?.["title"] !== undefined && (
            <p role="alert" className="mt-1 text-sm text-accent-text">
              {errors["title"]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="board-description"
            className="block font-mono text-xs uppercase tracking-widest text-muted mb-1"
          >
            DESCRIPTION
          </label>
          <textarea
            id="board-description"
            className={`${TEXT_FIELD_CLASS} resize-none`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={3}
          />
          {errors?.["description"] !== undefined && (
            <p role="alert" className="mt-1 text-sm text-accent-text">
              {errors["description"]}
            </p>
          )}
        </div>

        <Segment
          legend="APPEARANCE"
          name="appearance"
          options={[
            { value: "light", label: "LIGHT" },
            { value: "dark", label: "DARK" },
          ]}
          value={appearance}
          onChange={(next) => setAppearance(next as BoardAppearance)}
        />
        {errors?.["settings.appearance"] !== undefined && (
          <p role="alert" className="text-sm text-accent-text">
            {errors["settings.appearance"]}
          </p>
        )}

        <Segment
          legend="BACKGROUND"
          name="background"
          options={[
            { value: "plain", label: "PLAIN" },
            { value: "grid", label: "GRID" },
            { value: "dots", label: "DOTS" },
          ]}
          value={background}
          onChange={(next) => setBackground(next as BoardBackground)}
        />
        {errors?.["settings.background"] !== undefined && (
          <p role="alert" className="text-sm text-accent-text">
            {errors["settings.background"]}
          </p>
        )}

        {errors?.["detail"] !== undefined && (
          <p role="alert" className="text-sm text-accent-text">
            {errors["detail"]}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest hover:text-accent-text"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-ink font-mono text-xs uppercase tracking-widest rounded px-5 py-2.5 disabled:opacity-60"
          >
            {board === null ? "CREATE" : "SAVE"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

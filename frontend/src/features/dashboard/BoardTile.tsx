/**
 * One board in the dashboard grid. The optional featured variant (2-col,
 * 2px border) is decided by the page, since "featured" is a position, not a
 * board property.
 */

import { formatRelativeTime } from "../../lib/relativeTime";
import type { Board } from "../../api/boards";
import { BoardThumbnail } from "./BoardThumbnail";

interface BoardTileProps {
  board: Board;
  featured?: boolean;
  onSettings: () => void;
  onDelete: () => void;
}

export function BoardTile({
  board,
  featured = false,
  onSettings,
  onDelete,
}: BoardTileProps): React.JSX.Element {
  return (
    <article
      className={`bg-surface ${featured ? "col-span-2 border-2" : "border-[1.5px]"} border-ink rounded-xl overflow-hidden flex flex-col`}
    >
      <div className={featured ? "h-48" : "h-36"}>
        <BoardThumbnail id={board.id} />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h2 className="font-semibold truncate">{board.title}</h2>
        {board.description !== "" && (
          <p className="text-sm text-muted line-clamp-2">{board.description}</p>
        )}
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          EDITED {formatRelativeTime(board.updated_at)}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={onSettings}
            className="font-mono text-xs uppercase tracking-widest hover:text-accent-text"
          >
            SETTINGS
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="font-mono text-xs uppercase tracking-widest hover:text-accent-text"
          >
            DELETE
          </button>
        </div>
      </div>
    </article>
  );
}

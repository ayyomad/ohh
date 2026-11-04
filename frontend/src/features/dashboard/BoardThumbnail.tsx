/**
 * Procedural hatch placeholder. currentColor + opacity keeps it cheap in
 * both themes; the pattern id comes from useId so multiple tiles don't
 * collide their <pattern> defs. preserveAspectRatio="xMidYMid slice" covers
 * any tile aspect ratio so the hatch fills edge to edge.
 */

import { useId } from "react";
import { hatchFromId } from "../../lib/hatch";

export function BoardThumbnail({ id }: { id: string }): React.JSX.Element {
  const patternId = useId();
  const { angle, spacing, strokeWidth } = hatchFromId(id);

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full text-muted"
      viewBox="0 0 320 120"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect x="0" y="0" width="320" height="120" className="fill-surface-2" />
      <pattern
        id={patternId}
        patternUnits="userSpaceOnUse"
        width={spacing}
        height={spacing}
        patternTransform={`rotate(${angle})`}
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={spacing}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity="0.3"
        />
      </pattern>
      <rect x="0" y="0" width="320" height="120" fill={`url(#${patternId})`} />
    </svg>
  );
}

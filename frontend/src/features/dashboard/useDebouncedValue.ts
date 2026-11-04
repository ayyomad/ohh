/**
 * Debounced mirror of a fast-changing value (search box). New value wins;
 * cancelling the previous timer on every keystroke is what makes the query
 * fire once per pause instead of once per keystroke.
 */

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

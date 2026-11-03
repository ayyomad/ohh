/**
 * Smallest possible ambient typing for the Node-style global that
 * vite.config.ts reads (VITE_API_PROXY_TARGET) WITHOUT pulling in all of
 * @types/node, which is not on the approved dependency list (AGENTS.md).
 * This file is only included by tsconfig.node.json, i.e. for vite.config.ts.
 */

declare var process: {
  env: Record<string, string | undefined>;
};

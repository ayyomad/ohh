/**
 * App root. The theme lives in DashboardPage's header since Phase 2; this
 * wrapper only exists to keep main.tsx stable.
 */

import { DashboardPage } from "./features/dashboard/DashboardPage";

export function App(): React.JSX.Element {
  return <DashboardPage />;
}

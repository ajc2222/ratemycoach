import { ViewTransition } from "react";

/**
 * Templates remount on every navigation, so wrapping page content here lets
 * React run an enter/exit view transition between routes. The header and tab
 * bar live in the layout, carry their own transition names and stay still.
 * Browsers without the View Transitions API simply swap the page.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

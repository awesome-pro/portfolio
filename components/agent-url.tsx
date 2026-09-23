/**
 * Prints a link's absolute URL beside its label.
 *
 * Hidden in the default human view and revealed by `[data-view="agent"]` in
 * globals.css. Both views therefore ship the exact same HTML: no `cookies()`
 * call (which would opt every route out of static rendering and kill the ISR
 * windows) and no hydration mismatch. It also means the URLs are always in the
 * markup for anything reading the raw response.
 */
export default function AgentUrl({ url }: { url: string }) {
  return <span className="agent-url">{url}</span>;
}

/** A small sheet ghost, drawn for this project. Decorative: the ghost's text label carries the meaning. */
export function GhostIcon() {
  return (
    <svg className="ghost-icon" viewBox="0 0 40 44" width="30" height="33" aria-hidden="true" focusable="false">
      <path className="ghost-body" d="M20 2C10 2 4 9.5 4 19v21l5-4 5 4 6-4 6 4 5-4 5 4V19C36 9.5 30 2 20 2Z" />
      <ellipse className="ghost-eye" cx="14.5" cy="18" rx="3" ry="4" />
      <ellipse className="ghost-eye" cx="25.5" cy="18" rx="3" ry="4" />
      <ellipse className="ghost-mouth" cx="20" cy="28.5" rx="3.2" ry="4" />
    </svg>
  );
}
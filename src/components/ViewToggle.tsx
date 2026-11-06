import type { View } from '../preferences';

interface ViewToggleProps {
  view: View;
  onChange: (next: View) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const haunted = view === 'haunted';
  return (
    <div className="control">
      <button
        type="button"
        role="switch"
        aria-checked={haunted}
        className="switch"
        onClick={() => onChange(haunted ? 'mortal' : 'haunted')}
      >
        Haunted view
      </button>
      <span className="status">{haunted ? 'Haunted view is on' : 'Mortal view is on'}</span>
    </div>
  );
}
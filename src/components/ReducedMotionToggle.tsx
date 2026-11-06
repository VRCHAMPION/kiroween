interface ReducedMotionToggleProps {
  manual: boolean;
  systemReduces: boolean;
  onChange: (next: boolean) => void;
}

export function ReducedMotionToggle({ manual, systemReduces, onChange }: ReducedMotionToggleProps) {
  const on = systemReduces || manual;
  return (
    <div className="control">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-disabled={systemReduces ? 'true' : undefined}
        className="switch"
        onClick={() => {
          if (!systemReduces) {
            onChange(!manual);
          }
        }}
      >
        Reduce motion
      </button>
      <span className="status">
        {systemReduces ? 'Your device already requests reduced motion' : on ? 'Motion is reduced' : 'Motion is allowed'}
      </span>
    </div>
  );
}
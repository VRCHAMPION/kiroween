import { useMemo, useState } from 'react';
import { HauntedBackdrop } from './components/HauntedBackdrop';
import { ReducedMotionToggle } from './components/ReducedMotionToggle';
import { ViewToggle } from './components/ViewToggle';
import { PossessionCheck } from './features/possession-check/PossessionCheck';
import {
  readManualReducedMotion,
  readView,
  resolveReducedMotion,
  writeManualReducedMotion,
  writeView,
  type View,
} from './preferences';
import { useSystemReducedMotion } from './useSystemReducedMotion';
import { ViewContext } from './view-context';

export function App() {
  const [view, setView] = useState<View>(readView);
  const [manual, setManual] = useState<boolean>(readManualReducedMotion);
  const system = useSystemReducedMotion();
  const reduced = resolveReducedMotion(system, manual);
  const settings = useMemo(() => ({ view, reducedMotion: reduced }), [view, reduced]);

  const handleViewChange = (next: View) => {
    setView(next);
    writeView(next);
  };

  const handleManualChange = (next: boolean) => {
    setManual(next);
    writeManualReducedMotion(next);
  };

  return (
    <ViewContext.Provider value={settings}>
      <div className="app" data-view={view} data-reduced-motion={String(reduced)}>
        {view === 'haunted' && <HauntedBackdrop />}
        <header className="app-header">
          <h1>Phantom Inbox</h1>
          <p>Every scam has a ghost hiding in it. Phantom Inbox makes it visible.</p>
          <div className="settings" role="group" aria-label="Display settings">
            <ViewToggle view={view} onChange={handleViewChange} />
            <ReducedMotionToggle manual={manual} systemReduces={system} onChange={handleManualChange} />
          </div>
        </header>
        <main>
          <PossessionCheck />
        </main>
      </div>
    </ViewContext.Provider>
  );
}
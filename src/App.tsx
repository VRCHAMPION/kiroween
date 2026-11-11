import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/** Shown at the bottom of every screen. Plain wording, no claim of certainty. */
export const FOOTER_NOTE = 'Not a guarantee. When in doubt, call your bank on the number on your card.';

// Loaded the first time they are needed, so the first page load stays small.
const HauntedBackdrop = lazy(() => import('./components/HauntedBackdrop').then((m) => ({ default: m.HauntedBackdrop })));
const Seance = lazy(() => import('./features/seance/Seance').then((m) => ({ default: m.Seance })));

/** Tells the shell that the lazy part rendered next to it has finished loading, so focus can move into it. */
function Mounted({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return null;
}

type Screen = 'check' | 'seance';

const SCREEN_HEADING: Readonly<Record<Screen, string>> = { check: 'possession-check-heading', seance: 'seance-heading' };

export function App() {
  const [screen, setScreen] = useState<Screen>('check');
  const switched = useRef(false);
  const [seanceOpened, setSeanceOpened] = useState(false);
  const [seanceReady, setSeanceReady] = useState(false);
  const markSeanceReady = useCallback(() => setSeanceReady(true), []);
  const [view, setView] = useState<View>(readView);
  const [manual, setManual] = useState<boolean>(readManualReducedMotion);
  const system = useSystemReducedMotion();
  const reduced = resolveReducedMotion(system, manual);
  const settings = useMemo(() => ({ view, reducedMotion: reduced }), [view, reduced]);

  useEffect(() => {
    if (switched.current) document.getElementById(SCREEN_HEADING[screen])?.focus();
  }, [screen, seanceReady]);

  const openScreen = (next: Screen) => {
    switched.current = true;
    if (next === 'seance') setSeanceOpened(true);
    setScreen(next);
  };

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
        {view === 'haunted' && (
          <Suspense fallback={null}>
            <HauntedBackdrop />
          </Suspense>
        )}
        <header className="app-header">
          <h1>Phantom Inbox</h1>
          <p>Every scam has a ghost hiding in it. Phantom Inbox makes it visible.</p>
          <div className="settings" role="group" aria-label="Display settings">
            <ViewToggle view={view} onChange={handleViewChange} />
            <ReducedMotionToggle manual={manual} systemReduces={system} onChange={handleManualChange} />
          </div>
          <nav className="screen-nav" aria-label="Screens">
            <button type="button" className="button nav-button" aria-current={screen === 'check' ? 'page' : undefined} onClick={() => openScreen('check')}>
              Possession Check
            </button>
            <button type="button" className="button nav-button" aria-current={screen === 'seance' ? 'page' : undefined} onClick={() => openScreen('seance')}>
              {'S\u00e9ance'}
            </button>
          </nav>
        </header>
        <main>
          {/* Both screens stay mounted, so a message being checked or a game in progress is kept. */}
          <div hidden={screen !== 'check'}>
            <PossessionCheck />
          </div>
          <div hidden={screen !== 'seance'}>
            {seanceOpened && (
              <Suspense fallback={<p role="status">{'Loading the S\u00e9ance...'}</p>}>
                <Seance active={screen === 'seance'} />
                <Mounted onMount={markSeanceReady} />
              </Suspense>
            )}
          </div>
        </main>
        <footer className="app-footer">
          <p>{FOOTER_NOTE}</p>
        </footer>
      </div>
    </ViewContext.Provider>
  );
}
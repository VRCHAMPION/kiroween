import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLES } from '../../data/samples';
import { useViewSettings } from '../../view-context';
import { EndScreen } from './EndScreen';
import { ensureDetectionData, isDetectionDataLoaded } from '../../detection';
import { feedbackFor } from './feedback';
import { FeedbackPanel } from './FeedbackPanel';
import { answer, currentIndex, falseAlarms, missedTopics, newGame, next, scoreOf, type GameState, type Guess } from './game';
import { RoundCard } from './RoundCard';
import { SeanceTable } from './SeanceTable';
import './seance.css';

interface SeanceProps {
  /** Shortcuts only work while the S\u00e9ance screen is showing. */
  active?: boolean;
  /** Random numbers for picking messages. Tests pass a seeded one. */
  random?: () => number;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]') !== null;
}

/** The real-or-scam training game. Scores live only in memory. */
export function Seance({ active = true, random }: SeanceProps) {
  const { view } = useViewSettings();
  const [game, setGame] = useState<GameState>(() => newGame(SAMPLES, random));
  const [status, setStatus] = useState('');
  const roundHeading = useRef<HTMLHeadingElement>(null);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  const endHeading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const total = game.rounds.length;
  const index = currentIndex(game);
  const round = game.rounds[index];
  const score = scoreOf(game);
  const guess = game.phase === 'asking' ? undefined : game.answers[index];
  const feedback = useMemo(() => (guess === undefined ? undefined : feedbackFor(round, guess)), [round, guess]);

  useEffect(() => {
    if (!moved.current) return;
    const target = game.phase === 'asking' ? roundHeading : game.phase === 'feedback' ? feedbackHeading : endHeading;
    target.current?.focus();
  }, [game]);

  const answerNow = useCallback(
    (choice: Guess) => {
      if (game.phase !== 'asking') return;
      const after = answer(game, choice);
      const fb = feedbackFor(round, choice);
      moved.current = true;
      setGame(after);
      setStatus(`${fb.title} ${fb.message.split('. ')[0].replace(/\.$/, '')}. You have ${scoreOf(after)} right out of ${after.answers.length} so far.`);
    },
    [game, round],
  );

  // The first answer waits for the detection data if it has not loaded yet; later answers stay synchronous.
  const respond = useCallback(
    (choice: Guess) => {
      if (game.phase !== 'asking') return;
      if (isDetectionDataLoaded()) {
        answerNow(choice);
        return;
      }
      void ensureDetectionData().then(() => answerNow(choice));
    },
    [game.phase, answerNow],
  );

  const advance = useCallback(() => {
    if (game.phase !== 'feedback') return;
    const after = next(game);
    moved.current = true;
    setGame(after);
    setStatus(after.phase === 'finished' ? `Your s\u00e9ance is complete. You got ${scoreOf(after)} out of ${total} right.` : '');
  }, [game, total]);

  const playAgain = () => {
    moved.current = true;
    setGame(newGame(SAMPLES, random));
    setStatus('A new s\u00e9ance has begun. Message 1 is ready.');
  };

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (game.phase === 'asking' && (key === 'r' || key === 's')) {
        event.preventDefault();
        respond(key === 'r' ? 'real' : 'scam');
      } else if (game.phase === 'feedback' && event.key === 'Enter') {
        // Buttons and links already act on Enter; do not move on twice.
        if (event.target instanceof Element && event.target.closest('button, a, summary')) return;
        event.preventDefault();
        advance();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, game.phase, respond, advance]);

  return (
    <section className="seance" aria-labelledby="seance-heading">
      <h2 id="seance-heading" tabIndex={-1}>
        {'S\u00e9ance'}
      </h2>
      <p className="intro">A practice game. Read each message and decide: is it real, or a scam? There are {total} messages, and nothing is saved.</p>
      <p className="hint seance-keys">Keyboard: press R for Real, S for Scam, and Enter for the next message.</p>

      {view === 'haunted' && <SeanceTable lit={score} total={total} />}
      <p className="seance-progress">
        {game.phase === 'finished'
          ? `All ${total} messages done \u00b7 ${score} right`
          : `Message ${index + 1} of ${total} \u00b7 ${score} right so far`}
      </p>

      {game.phase === 'finished' ? (
        <EndScreen score={score} total={total} missed={missedTopics(game)} falseAlarms={falseAlarms(game)} headingRef={endHeading} onPlayAgain={playAgain} />
      ) : (
        <>
          <RoundCard sample={round} number={index + 1} total={total} headingRef={roundHeading} feedback={feedback} />
          {game.phase === 'asking' || !feedback ? (
            <div className="seance-answer" role="group" aria-labelledby="seance-question">
              <p id="seance-question" className="round-question">
                Real or scam?
              </p>
              <div className="seance-buttons">
                <button type="button" className="button seance-choice choice-real" aria-keyshortcuts="R" onClick={() => respond('real')}>
                  Real <kbd aria-hidden="true">R</kbd>
                </button>
                <button type="button" className="button seance-choice choice-scam" aria-keyshortcuts="S" onClick={() => respond('scam')}>
                  Scam <kbd aria-hidden="true">S</kbd>
                </button>
              </div>
            </div>
          ) : (
            <FeedbackPanel feedback={feedback} attachments={round.attachments ?? []} last={index + 1 >= total} headingRef={feedbackHeading} onNext={advance} />
          )}
        </>
      )}

      <p role="status" className="seance-status">
        {status}
      </p>
    </section>
  );
}
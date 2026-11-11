import type { Ref } from 'react';
import type { ScamTopic } from '../../data/samples';
import { endSummary, TOPIC_TIPS } from './feedback';

interface EndScreenProps {
  score: number;
  total: number;
  missed: readonly ScamTopic[];
  falseAlarms: number;
  headingRef: Ref<HTMLHeadingElement>;
  onPlayAgain: () => void;
}

/** The kind summary after the last message. Nothing here is saved. */
export function EndScreen({ score, total, missed, falseAlarms, headingRef, onPlayAgain }: EndScreenProps) {
  return (
    <section className="seance-end" aria-labelledby="end-heading">
      <h3 id="end-heading" ref={headingRef} tabIndex={-1}>
        {'Your s\u00e9ance is complete'}
      </h3>
      <p className="end-score">
        You got <strong>{score}</strong> out of {total} right.
      </p>
      <p>{endSummary(score, total)}</p>

      {missed.length === 0 ? (
        <p>You did not miss a single scam.</p>
      ) : (
        <>
          <h4>Scam types to look out for</h4>
          <ul className="missed-topics">
            {missed.map((topic) => (
              <li key={topic}>
                <strong>{TOPIC_TIPS[topic].label}.</strong> {TOPIC_TIPS[topic].tip}
              </li>
            ))}
          </ul>
        </>
      )}

      {falseAlarms > 0 && (
        <p>
          {falseAlarms === 1 ? 'You were extra careful with 1 real message.' : `You were extra careful with ${falseAlarms} real messages.`} That is okay: checking
          first is a good habit, and the reasons above show what safe messages look like.
        </p>
      )}

      <p className="hint">Your answers and score are not saved anywhere. They disappear when you leave.</p>
      <button type="button" className="button button-primary" onClick={onPlayAgain}>
        Play again
      </button>
    </section>
  );
}
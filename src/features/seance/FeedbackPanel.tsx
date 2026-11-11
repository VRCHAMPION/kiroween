import type { Ref } from 'react';
import type { RedFlag, Verdict } from '../../detection';
import { VerdictIcon } from '../possession-check/VerdictIcon';
import type { Feedback } from './feedback';

const VERDICT_WORDS: Readonly<Record<Verdict, string>> = {
  'likely scam': 'Likely scam',
  suspicious: 'Suspicious',
  'looks safe': 'Looks safe',
};

function whereFound(flag: RedFlag, attachments: readonly string[]): string {
  if (flag.source === 'header') return 'In the email details';
  if (flag.source === 'attachment') return `In the attachment name ${attachments[flag.attachmentIndex ?? -1] ?? ''}`.trim();
  return 'In the message';
}

interface FeedbackPanelProps {
  feedback: Feedback;
  attachments: readonly string[];
  last: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onNext: () => void;
}

/** The kind explanation after an answer, with the real engine's own check. */
export function FeedbackPanel({ feedback, attachments, last, headingRef, onNext }: FeedbackPanelProps) {
  const { outcome, title, message, result, flags, safeReasons } = feedback;
  return (
    <section className={`seance-feedback outcome-${outcome}`} aria-labelledby="feedback-heading">
      <h3 id="feedback-heading" ref={headingRef} tabIndex={-1}>
        {title}
      </h3>
      <p className="feedback-message">{message}</p>

      {flags.length > 0 && (
        <>
          <h4>What gives it away</h4>
          <ol className="seance-flags">
            {flags.map(({ flag, number }) => (
              <li key={flag.id} id={`seance-flag-${number}`} className={`seance-flag severity-${flag.severity}`}>
                <p className="flag-title">
                  <span className="flag-number">{number}</span> {flag.label}
                </p>
                <p className="flag-quote">
                  <q>{flag.text}</q>
                  <span className="flag-where">{whereFound(flag, attachments)}</span>
                </p>
                <p className="flag-reason">{flag.reason}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      {safeReasons.length > 0 && (
        <>
          <h4>Why it is safe</h4>
          <ul className="safe-reasons">
            {safeReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>
      )}

      <div className="seance-engine">
        <VerdictIcon verdict={result.verdict} />
        <p>
          Phantom Inbox&apos;s check: <strong>{VERDICT_WORDS[result.verdict]}</strong>, haunt score {result.score} out of 100.
        </p>
      </div>

      <button type="button" className="button button-primary seance-next" onClick={onNext}>
        {last ? 'See your results' : 'Next message'}
      </button>
    </section>
  );
}
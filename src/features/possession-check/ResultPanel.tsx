import { useEffect, useRef } from 'react';
import type { AnalysisInput, AnalysisResult, Verdict } from '../../detection';
import { FlagCard } from './FlagCard';
import { HighlightedText, type NumberedSpan } from './HighlightedText';
import { VerdictIcon } from './VerdictIcon';

const VERDICT_TEXT: Readonly<Record<Verdict, { title: string; advice: string; className: string }>> = {
  'likely scam': {
    title: 'Likely scam',
    advice: 'Do not reply, click links, share codes or pay. If you are worried, contact the organisation using a number you already trust.',
    className: 'verdict-scam',
  },
  suspicious: {
    title: 'Suspicious',
    advice: 'Be careful. Check with the sender in another way, such as a number you already trust, before you do anything.',
    className: 'verdict-suspicious',
  },
  'looks safe': {
    title: 'Looks safe',
    advice: 'We found no strong warning signs. If something still feels wrong, ask someone you trust before acting.',
    className: 'verdict-safe',
  },
};

interface ResultPanelProps {
  input: AnalysisInput;
  result: AnalysisResult;
}

export function ResultPanel({ input, result }: ResultPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [result]);

  const verdict = VERDICT_TEXT[result.verdict];
  const numbered = result.flags.map((flag, i) => ({ flag, number: i + 1 }));
  const spansFor = (source: 'body' | 'header', attachmentIndex?: number): NumberedSpan[] =>
    numbered
      .filter(({ flag }) => flag.source === source && (attachmentIndex === undefined || flag.attachmentIndex === attachmentIndex))
      .map(({ flag, number }) => ({ start: flag.start, end: flag.end, number }));
  const attachments = input.attachments ?? [];
  const headerSpans = spansFor('header');
  const flaggedAttachments = attachments
    .map((name, index) => ({
      name,
      spans: numbered
        .filter(({ flag }) => flag.source === 'attachment' && flag.attachmentIndex === index)
        .map(({ flag, number }) => ({ start: flag.start, end: flag.end, number })),
    }))
    .filter((a) => a.spans.length > 0);

  return (
    <section className="result-panel" aria-labelledby="result-heading">
      <h2 id="result-heading" ref={headingRef} tabIndex={-1}>
        Result
      </h2>
      <div className={`verdict ${verdict.className}`}>
        <VerdictIcon verdict={result.verdict} />
        <p className="verdict-title">{verdict.title}</p>
      </div>
      <p className="score-text">
        Haunt score: <strong>{result.score}</strong> out of 100
      </p>
      <meter className="score-meter" min={0} max={100} low={25} high={60} optimum={0} value={result.score} aria-label="Haunt score" />
      <p className="verdict-advice">{verdict.advice}</p>
      <p className="disclaimer">
        Phantom Inbox looks for known warning signs. It can be wrong, so this is never a guarantee that a message is safe or a scam.
      </p>

      {result.flags.length === 0 ? (
        <p className="no-flags">We found no warning signs in this message.</p>
      ) : (
        <>
          <h3>Where the warning signs are</h3>
          <div className="checked-message">
            <HighlightedText text={input.text} spans={spansFor('body')} />
          </div>
          {headerSpans.length > 0 && (
            <div className="checked-details">
              <h4>Email details</h4>
              <HighlightedText text={result.headerText} spans={headerSpans} className="message-text header-text" />
            </div>
          )}
          {flaggedAttachments.length > 0 && (
            <div className="checked-details">
              <h4>Attachments</h4>
              <ul className="attachment-list">
                {flaggedAttachments.map((a) => (
                  <li key={a.name}>
                    <HighlightedText text={a.name} spans={a.spans} className="attachment-name" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h3>
            {result.flags.length === 1 ? '1 warning sign' : `${result.flags.length} warning signs`}
          </h3>
          <ol className="flag-list">
            {numbered.map(({ flag, number }) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                number={number}
                attachmentName={flag.attachmentIndex === undefined ? undefined : attachments[flag.attachmentIndex]}
              />
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
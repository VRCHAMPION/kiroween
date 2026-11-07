import { useEffect, useRef } from 'react';
import type { AnalysisInput, AnalysisResult, Verdict } from '../../detection';
import { useViewSettings } from '../../view-context';
import { FlagCard } from './FlagCard';
import { HauntedText, type NumberedFlag } from './ghosts/HauntedText';
import { HighlightedText } from './HighlightedText';
import { ScoreCandle } from './ScoreCandle';
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

  const { view, reducedMotion } = useViewSettings();
  const haunted = view === 'haunted';
  const verdict = VERDICT_TEXT[result.verdict];
  const numbered: NumberedFlag[] = result.flags.map((flag, i) => ({ flag, number: i + 1 }));
  const attachments = input.attachments ?? [];
  const bodyFlags = numbered.filter(({ flag }) => flag.source === 'body');
  const headerFlags = numbered.filter(({ flag }) => flag.source === 'header');
  const flaggedAttachments = attachments
    .map((name, index) => ({
      name,
      index,
      flags: numbered.filter(({ flag }) => flag.source === 'attachment' && flag.attachmentIndex === index),
    }))
    .filter((a) => a.flags.length > 0);

  /** Mortal view shows calm highlights; Haunted view puts a ghost on each flagged span. */
  const renderText = (text: string, flags: readonly NumberedFlag[], className?: string) =>
    haunted ? (
      <HauntedText text={text} flags={flags} className={className} />
    ) : (
      <HighlightedText
        text={text}
        spans={flags.map(({ flag, number }) => ({ start: flag.start, end: flag.end, number }))}
        className={className}
      />
    );

  return (
    <section className="result-panel" aria-labelledby="result-heading">
      <h2 id="result-heading" ref={headingRef} tabIndex={-1}>
        Result
      </h2>
      <div className={`verdict ${verdict.className}`}>
        <VerdictIcon verdict={result.verdict} />
        <p className="verdict-title">{verdict.title}</p>
      </div>
      <div className="score">
        {haunted && <ScoreCandle key={`${result.score}-${result.flags.length}`} score={result.score} animate={!reducedMotion} />}
        <div className="score-copy">
          <p className="score-text">
            Haunt score: <strong>{result.score}</strong> out of 100
          </p>
          {haunted && <p className="candle-caption">The candle burns down as the haunt score rises.</p>}
        </div>
      </div>
      <meter
        className={haunted ? 'score-meter visually-hidden' : 'score-meter'}
        min={0}
        max={100}
        low={25}
        high={60}
        optimum={0}
        value={result.score}
        aria-label="Haunt score"
      />
      <p className="verdict-advice">{verdict.advice}</p>
      <p className="disclaimer">
        Phantom Inbox looks for known warning signs. It can be wrong, so this is never a guarantee that a message is safe or a scam.
      </p>

      {result.flags.length === 0 ? (
        <p className="no-flags">We found no warning signs in this message.</p>
      ) : (
        <>
          <h3>Where the warning signs are</h3>
          {haunted && (
            <p className="ghost-hint">
              Each ghost sits on the words it is warning about. Press a ghost to hear why. Point at or focus a link ghost to hear its True Name.
            </p>
          )}
          <div className="checked-message">{renderText(input.text, bodyFlags)}</div>
          {headerFlags.length > 0 && (
            <div className="checked-details">
              <h4>Email details</h4>
              {renderText(result.headerText, headerFlags, 'message-text header-text')}
            </div>
          )}
          {flaggedAttachments.length > 0 && (
            <div className="checked-details">
              <h4>Attachments</h4>
              <ul className="attachment-list">
                {flaggedAttachments.map((a) => (
                  <li key={`${a.index}-${a.name}`}>{renderText(a.name, a.flags, 'attachment-name')}</li>
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
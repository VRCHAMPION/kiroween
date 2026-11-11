import type { Ref } from 'react';
import type { Channel, SampleMessage } from '../../data/samples';
import { useViewSettings } from '../../view-context';
import { HauntedText } from '../possession-check/ghosts/HauntedText';
import { HighlightedText } from '../possession-check/HighlightedText';
import type { Feedback } from './feedback';

export const CHANNEL_NAME: Readonly<Record<Channel, string>> = { sms: 'SMS', whatsapp: 'WhatsApp', email: 'Email' };

interface RoundCardProps {
  sample: SampleMessage;
  number: number;
  total: number;
  headingRef: Ref<HTMLHeadingElement>;
  /** Present once the player has answered: the words of the main red flags are then marked. */
  feedback?: Feedback;
}

/** One practice message, shown as plain text. After an answer its red flags are marked on the words. */
export function RoundCard({ sample, number, total, headingRef, feedback }: RoundCardProps) {
  const { view } = useViewSettings();
  const bodyFlags = feedback ? feedback.flags.filter(({ flag }) => flag.source === 'body') : [];
  const missed = feedback?.outcome === 'missed-scam';
  const from = sample.headers?.From;
  const subject = sample.headers?.Subject;
  const attachments = sample.attachments ?? [];

  let message;
  if (bodyFlags.length === 0) {
    message = <p className="message-text">{sample.text}</p>;
  } else if (view === 'haunted') {
    message = (
      <div className={missed ? 'seance-missed' : undefined} data-testid="seance-ghost-words">
        <HauntedText text={sample.text} flags={bodyFlags} cardIdPrefix="seance-flag-" />
      </div>
    );
  } else {
    message = <HighlightedText text={sample.text} spans={bodyFlags.map(({ flag, number: n }) => ({ start: flag.start, end: flag.end, number: n }))} />;
  }

  return (
    <article className="round-card" aria-labelledby="round-heading">
      <h3 id="round-heading" ref={headingRef} tabIndex={-1}>
        Message {number} of {total}
      </h3>
      <p className="round-channel">
        <span className={`channel-badge channel-${sample.channel}`}>{CHANNEL_NAME[sample.channel]}</span>
      </p>
      {(from || subject) && (
        <dl className="round-email">
          {from && (
            <>
              <dt>From</dt>
              <dd>{from}</dd>
            </>
          )}
          {subject && (
            <>
              <dt>Subject</dt>
              <dd>{subject}</dd>
            </>
          )}
        </dl>
      )}
      <div className="round-message">{message}</div>
      {attachments.length > 0 && (
        <p className="round-attachments">
          <strong>Attachments:</strong> {attachments.join(', ')}
        </p>
      )}
    </article>
  );
}
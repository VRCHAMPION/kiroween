import type { KeyboardEvent } from 'react';
import type { RedFlag } from '../../../detection';
import { SEVERITY_WORDS } from '../FlagCard';
import { Countdown } from './Countdown';
import { deadlineOf, ghostKind, trueNameFor } from './ghost-effects';
import { GhostIcon } from './GhostIcon';
import { TrueNameText } from './TrueNameText';

export interface GhostProps {
  flag: RedFlag;
  number: number;
  idPrefix: string;
  /** Start of the id of the matching flag card, for the "Read warning sign" link. */
  cardIdPrefix?: string;
  speaking: boolean;
  open: boolean;
  frozen: boolean;
  onSpeak: (number: number | undefined) => void;
  onPointer: (number: number, inside: boolean) => void;
  onToggle: (number: number) => void;
  onClose: (number: number) => void;
}

/**
 * One red flag's ghost. It is a disclosure button: activating it opens the whisper with the
 * plain-English reason. Link ghosts also speak the link's True Name on hover or focus.
 */
export function Ghost({ flag, number, idPrefix, cardIdPrefix = 'flag-', speaking, open, frozen, onSpeak, onPointer, onToggle, onClose }: GhostProps) {
  const kind = ghostKind(flag);
  const trueName = trueNameFor(flag);
  const hasDeadline = flag.type === 'urgency' && deadlineOf(flag.text) !== undefined;
  const bubbleId = `${idPrefix}-bubble-${number}`;
  const whisperId = `${idPrefix}-whisper-${number}`;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      onClose(number);
      onSpeak(undefined);
    }
  };

  return (
    <span
      className={`ghost ghost-${kind}${open ? ' is-open' : ''}${speaking ? ' is-speaking' : ''}`}
      onMouseEnter={trueName ? () => onPointer(number, true) : undefined}
      onMouseLeave={trueName ? () => onPointer(number, false) : undefined}
    >
      <button
        type="button"
        className="ghost-button"
        aria-expanded={open}
        aria-controls={whisperId}
        aria-describedby={trueName ? bubbleId : undefined}
        onClick={() => onToggle(number)}
        onFocus={trueName ? () => onSpeak(number) : undefined}
        onBlur={trueName ? () => onSpeak(undefined) : undefined}
        onKeyDown={onKeyDown}
      >
        <GhostIcon />
        <span className="ghost-tag">
          <span className="visually-hidden">Red flag</span>{' '}
          <span className="ghost-number">{number}</span>{' '}
          <span className="ghost-label">{flag.label}</span>
        </span>
        {hasDeadline && <Countdown text={flag.text} frozen={frozen} />}
      </button>
      {trueName && (
        <span id={bubbleId} role="tooltip" className={speaking ? 'ghost-bubble is-visible' : 'ghost-bubble'}>
          <span className="ghost-bubble-title">True Name: </span>
          <TrueNameText trueName={trueName} />
          <span className="ghost-bubble-note"> {trueName.note}</span>
        </span>
      )}
      <span id={whisperId} className="ghost-whisper" hidden={!open}>
        <span className="ghost-whisper-title">{flag.label}</span>
        <span className="ghost-whisper-severity">{SEVERITY_WORDS[flag.severity]}</span>
        <span className="ghost-whisper-reason">{flag.reason}</span>
        {trueName && (
          <span className="ghost-whisper-true-name">
            <span className="ghost-bubble-title">True Name: </span>
            <TrueNameText trueName={trueName} />
            <span className="ghost-whisper-note">{trueName.note}</span>
          </span>
        )}
        {hasDeadline && (
          <span className="ghost-whisper-note">
            The countdown shows the deadline this message sets. It is made up to rush you, and nothing happens when it runs out.
          </span>
        )}
        <a className="ghost-whisper-link" href={`#${cardIdPrefix}${number}`}>
          Read warning sign {number}
        </a>
      </span>
    </span>
  );
}
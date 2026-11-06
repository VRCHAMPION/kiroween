import { Fragment } from 'react';
import { segmentText } from './segments';

export interface NumberedSpan {
  start: number;
  end: number;
  number: number;
}

interface HighlightedTextProps {
  text: string;
  spans: readonly NumberedSpan[];
  className?: string;
}

/** Shows text as plain text with <mark> around flagged words and the matching card number after each flag. */
export function HighlightedText({ text, spans, className = 'message-text' }: HighlightedTextProps) {
  const segments = segmentText(text, spans);
  return (
    <p className={className}>
      {segments.map((segment) => (
        <Fragment key={segment.start}>
          {segment.covering.length > 0 ? <mark>{segment.text}</mark> : segment.text}
          {segment.ending.map((index) => (
            <span key={index} className="flag-ref">
              <span className="visually-hidden"> (red flag </span>
              {spans[index].number}
              <span className="visually-hidden">)</span>
            </span>
          ))}
        </Fragment>
      ))}
    </p>
  );
}
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { lookalikeParts, type RedFlag } from '../../../detection';
import { useViewSettings } from '../../../view-context';
import { segmentText } from '../segments';
import { Ghost } from './Ghost';
import { ghostKind, trueNameFor } from './ghost-effects';
import './ghosts.css';

export interface NumberedFlag {
  flag: RedFlag;
  number: number;
}

interface HauntedTextProps {
  text: string;
  /** Flags whose spans index into `text`. */
  flags: readonly NumberedFlag[];
  className?: string;
}

/** How long a link ghost keeps talking after the pointer leaves, so the pointer can reach its bubble. */
const HIDE_DELAY_MS = 300;

/**
 * Haunted rendering of checked text: flagged words become ghost marks, look-alike letters twitch,
 * and each flag's ghost sits right after its words. All text stays plain text.
 */
export function HauntedText({ text, flags, className = 'message-text' }: HauntedTextProps) {
  const { reducedMotion } = useViewSettings();
  const idPrefix = `ghost${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [speaking, setSpeaking] = useState<number | undefined>();
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  useEffect(() => {
    if (speaking === undefined) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSpeaking(undefined);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [speaking]);

  const speak = (number: number | undefined) => {
    window.clearTimeout(hideTimer.current);
    setSpeaking(number);
  };

  const pointer = (number: number, inside: boolean) => {
    window.clearTimeout(hideTimer.current);
    if (inside) {
      setSpeaking(number);
    } else {
      hideTimer.current = window.setTimeout(() => setSpeaking((current) => (current === number ? undefined : current)), HIDE_DELAY_MS);
    }
  };

  const toggle = (number: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });

  const close = (number: number) =>
    setOpen((current) => {
      if (!current.has(number)) return current;
      const next = new Set(current);
      next.delete(number);
      return next;
    });

  const flagSpans = flags.map(({ flag }) => ({ start: flag.start, end: flag.end }));
  const letterSpans = flags.flatMap(({ flag }) =>
    flag.type === 'lookalike-domain'
      ? lookalikeParts(flag.text).map((r) => ({ start: flag.start + r.start, end: flag.start + r.end }))
      : [],
  );
  const flagCount = flagSpans.length;
  const segments = segmentText(text, [...flagSpans, ...letterSpans]);

  return (
    <p className={`${className} haunted-text`}>
      {segments.map((segment) => {
        const covering = segment.covering.filter((i) => i < flagCount);
        const isLetter = segment.covering.some((i) => i >= flagCount);
        let content: ReactNode = segment.text;
        if (isLetter) {
          content = (
            <span className="lookalike-char" data-testid="lookalike-char">
              {segment.text}
            </span>
          );
        }
        if (covering.length > 0) {
          const kinds = [...new Set(covering.map((i) => ghostKind(flags[i].flag)))];
          const speaker = covering.map((i) => flags[i]).find((f) => trueNameFor(f.flag) !== undefined);
          const isSpeaking = covering.some((i) => flags[i].number === speaking);
          const classes = ['ghost-mark', ...kinds.map((k) => `kind-${k}`), isSpeaking ? 'is-speaking' : ''].filter(Boolean).join(' ');
          content = (
            <mark
              className={classes}
              onMouseEnter={speaker ? () => pointer(speaker.number, true) : undefined}
              onMouseLeave={speaker ? () => pointer(speaker.number, false) : undefined}
            >
              {content}
            </mark>
          );
        }
        return (
          <Fragment key={segment.start}>
            {content}
            {segment.ending
              .filter((i) => i < flagCount)
              .map((i) => (
                <Ghost
                  key={flags[i].flag.id}
                  flag={flags[i].flag}
                  number={flags[i].number}
                  idPrefix={idPrefix}
                  speaking={speaking === flags[i].number}
                  open={open.has(flags[i].number)}
                  frozen={reducedMotion}
                  onSpeak={speak}
                  onPointer={pointer}
                  onToggle={toggle}
                  onClose={close}
                />
              ))}
          </Fragment>
        );
      })}
    </p>
  );
}
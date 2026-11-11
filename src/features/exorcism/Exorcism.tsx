import { useId, useRef, useState } from 'react';
import type { AnalysisResult } from '../../detection';
import { useViewSettings } from '../../view-context';
import { GhostIcon } from '../possession-check/ghosts/GhostIcon';
import { createAudioContext, playChime } from './chime';
import { exorcismPlan, type FamilyWarning, type Step } from './plan';
import { banishedCount, MAX_RITUAL_GHOSTS } from './ritual';
import './exorcism.css';

interface ExorcismProps {
  result: Pick<AnalysisResult, 'verdict' | 'flags'>;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function selectContents(element: HTMLElement | null) {
  if (!element) return;
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

function StepBody({ step }: { step: Step }) {
  return (
    <>
      {step.urgent && <p className="step-urgent-tag">Do this first</p>}
      <p className="step-title">{step.title}</p>
      <p className="step-detail">{step.detail}</p>
      {step.links && (
        <p className="step-links">
          {step.links.map((link) => (
            <a key={link.href} className="button step-link" href={link.href} {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {link.label}
            </a>
          ))}
        </p>
      )}
    </>
  );
}

function WarningBlock({ lang, label, text, onCopied, onCopySuccess }: { lang: 'en' | 'hi'; label: string; text: string; onCopied: (message: string) => void; onCopySuccess: () => void }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const name = lang === 'en' ? 'English' : 'Hindi';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    if (await copyText(text)) {
      onCopied(`${name} warning copied.`);
      onCopySuccess();
    } else {
      selectContents(textRef.current);
      onCopied(`Your browser did not let us copy, so the ${name} warning is selected. Press Ctrl+C, or long-press and choose Copy.`);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ text });
    } catch {
      // The user closed the share sheet; nothing to do.
    }
  };

  return (
    <div className="warning-block">
      <p className="warning-label">{label}</p>
      <p ref={textRef} className="warning-text" lang={lang === 'hi' ? 'hi' : undefined}>
        {text}
      </p>
      <div className="warning-actions">
        <button type="button" className="button" onClick={() => void copy()}>
          Copy {name} warning
        </button>
        {canShare && (
          <button type="button" className="button button-secondary" onClick={() => void share()}>
            Share {name} warning
          </button>
        )}
      </div>
    </div>
  );
}

function FamilyWarnings({ warning, onCopySuccess }: { warning: FamilyWarning; onCopySuccess: () => void }) {
  const [status, setStatus] = useState('');
  return (
    <div className="family-warning">
      <h4>Warn your family</h4>
      <p className="hint">Copy this message and send it to your family on WhatsApp or SMS, so they do not fall for the same trick.</p>
      <WarningBlock lang="en" label="In simple English" text={warning.en} onCopied={setStatus} onCopySuccess={onCopySuccess} />
      <WarningBlock
        lang="hi"
        label="In Hindi (हिंदी में)"
        text={warning.hi}
        onCopied={setStatus}
        onCopySuccess={onCopySuccess}
      />
      <p role="status" className="notice">
        {status}
      </p>
    </div>
  );
}

/** "What to do now": plain steps in Mortal view, an exorcism ritual in Haunted view. */
export function Exorcism({ result }: ExorcismProps) {
  const { view } = useViewSettings();
  const idPrefix = `step${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set());
  // Sound is off until the user turns it on. It lives in memory only and is never stored.
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | undefined>(undefined);
  const plan = exorcismPlan(result);
  if (!plan) return null;

  const haunted = view === 'haunted';
  const total = plan.steps.length;
  const readCount = plan.steps.filter((s) => read.has(s.id)).length;
  const ghosts = Math.min(MAX_RITUAL_GHOSTS, result.flags.length);
  const banished = banishedCount(readCount, total, ghosts);
  const done = readCount === total;

  const chime = () => {
    if (!sound) return;
    audio.current ??= createAudioContext();
    if (audio.current) playChime(audio.current);
  };

  const toggle = (id: string) => {
    if (!read.has(id)) chime();
    setRead((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className={haunted ? 'exorcism exorcism-ritual' : 'exorcism'} aria-labelledby="exorcism-heading" id="exorcism">
      <h3 id="exorcism-heading">{haunted ? 'The Exorcism' : 'What to do now'}</h3>
      {haunted && <p className="exorcism-subtitle">What to do now</p>}
      <p className="exorcism-intro">{plan.intro}</p>
      <button type="button" className="button button-secondary sound-toggle" aria-pressed={sound} onClick={() => setSound((on) => !on)}>
        {sound ? 'Sound: on' : 'Sound: off'}
      </button>

      {haunted && (
        <>
          <div className="ritual-circle" aria-hidden="true" data-testid="ritual-circle">
            <span className="ritual-ring" />
            <span className="ritual-ghosts">
              {Array.from({ length: ghosts }, (_, i) => (
                <span key={i} className={i < banished ? 'ritual-ghost is-banished' : 'ritual-ghost'} data-testid="ritual-ghost">
                  <GhostIcon />
                </span>
              ))}
            </span>
          </div>
          <p className="ritual-instructions">Read each step and tick it to banish a ghost. The steps stay here, word for word.</p>
          <p role="status" className="ritual-progress">
            {done
              ? 'The ghosts are banished. Stay safe.'
              : readCount === 0
                ? ''
                : `${readCount} of ${total} steps read. ${banished} of ${ghosts} ghosts banished.`}
          </p>
        </>
      )}

      <ol className="exorcism-steps">
        {plan.steps.map((step) => {
          const isRead = read.has(step.id);
          const classes = ['exorcism-step', step.urgent ? 'is-urgent' : '', isRead ? 'is-read' : ''].filter(Boolean).join(' ');
          return (
            <li key={step.id} className={classes}>
              <StepBody step={step} />
              {haunted && (
                <label className="ritual-check" htmlFor={`${idPrefix}-${step.id}`}>
                  <input id={`${idPrefix}-${step.id}`} type="checkbox" checked={isRead} onChange={() => toggle(step.id)} />
                  <span>I have read this step</span>
                </label>
              )}
            </li>
          );
        })}
      </ol>

      <FamilyWarnings warning={plan.warning} onCopySuccess={chime} />
    </section>
  );
}
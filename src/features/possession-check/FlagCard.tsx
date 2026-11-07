import type { RedFlag, Severity } from '../../detection';

export const SEVERITY_WORDS: Readonly<Record<Severity, string>> = {
  high: 'Strong warning sign',
  medium: 'Warning sign',
  low: 'Mild warning sign',
};

interface FlagCardProps {
  flag: RedFlag;
  number: number;
  attachmentName?: string;
}

function whereFound(flag: RedFlag, attachmentName?: string): string {
  if (flag.source === 'header') return 'Found in the email details';
  if (flag.source === 'attachment') return `Found in the attachment name ${attachmentName ?? ''}`.trim();
  return 'Found in the message';
}

export function FlagCard({ flag, number, attachmentName }: FlagCardProps) {
  return (
    <li className={`flag-card severity-${flag.severity}`} id={`flag-${number}`}>
      <h4 className="flag-title">
        <span className="flag-number">{number}</span> {flag.label}
      </h4>
      <p className="flag-severity">{SEVERITY_WORDS[flag.severity]}</p>
      <p className="flag-quote">
        <q>{flag.text}</q>
        <span className="flag-where">{whereFound(flag, attachmentName)}</span>
      </p>
      <p className="flag-reason">{flag.reason}</p>
    </li>
  );
}
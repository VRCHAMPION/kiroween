export interface LoadedDetails {
  origin: string;
  headers?: Readonly<Record<string, string>>;
  headerText?: string;
  attachments: readonly string[];
  from: string;
  subject: string;
  linkCount: number;
}

interface EmailDetailsProps {
  details: LoadedDetails;
  onRemove: () => void;
}

export function EmailDetails({ details, onRemove }: EmailDetailsProps) {
  return (
    <section className="email-details" aria-labelledby="email-details-heading">
      <h3 id="email-details-heading">Email details from {details.origin}</h3>
      <dl>
        {details.from !== '' && (
          <>
            <dt>From</dt>
            <dd>{details.from}</dd>
          </>
        )}
        {details.subject !== '' && (
          <>
            <dt>Subject</dt>
            <dd>{details.subject}</dd>
          </>
        )}
        <dt>Links found</dt>
        <dd>{details.linkCount}</dd>
        <dt>Attachments</dt>
        <dd>{details.attachments.length === 0 ? 'None' : details.attachments.join(', ')}</dd>
      </dl>
      <button type="button" className="button button-secondary" onClick={onRemove}>
        Remove email details
      </button>
    </section>
  );
}
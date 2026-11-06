import { useRef, useState } from 'react';
import { SAMPLES } from '../../data/samples';
import { analyse, type AnalysisInput, type AnalysisResult } from '../../detection';
import type { ParsedEmail } from '../../email/parse-eml';
import { EmailDetails, type LoadedDetails } from './EmailDetails';
import { EmlPicker } from './EmlPicker';
import { ResultPanel } from './ResultPanel';
import { SamplePicker } from './SamplePicker';
import './possession-check.css';

export const EMPTY_MESSAGE_ERROR = 'Paste a message, choose a sample, or open an .eml file first.';

const LINK = /\bhttps?:\/\/[^\s<>"'`]+/gi;
const countLinks = (text: string) => new Set(text.match(LINK) ?? []).size;

interface Checked {
  input: AnalysisInput;
  result: AnalysisResult;
}

export function PossessionCheck() {
  const [text, setText] = useState('');
  const [details, setDetails] = useState<LoadedDetails | undefined>();
  const [sampleId, setSampleId] = useState('');
  const [checked, setChecked] = useState<Checked | undefined>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const changeText = (value: string) => {
    setText(value);
    setChecked(undefined);
    setSampleId('');
    setError('');
    if (value.trim() === '') {
      setDetails(undefined);
    }
  };

  const pickSample = (id: string) => {
    setSampleId(id);
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return;
    setText(sample.text);
    const hasDetails = sample.headers !== undefined || (sample.attachments?.length ?? 0) > 0;
    setDetails(
      hasDetails
        ? {
            origin: 'the sample',
            headers: sample.headers,
            attachments: sample.attachments ?? [],
            from: sample.headers?.From ?? '',
            subject: sample.headers?.Subject ?? '',
            linkCount: countLinks(sample.text),
          }
        : undefined,
    );
    setChecked(undefined);
    setError('');
    setNotice(`Sample loaded: ${sample.title}. Press "Check this message" when you are ready.`);
  };

  const loadEmail = (email: ParsedEmail, fileName: string) => {
    setText(email.body);
    setSampleId('');
    setDetails({
      origin: fileName,
      headerText: email.headerText,
      attachments: email.attachments,
      from: email.from,
      subject: email.subject,
      linkCount: email.links.length,
    });
    setChecked(undefined);
    setError('');
    setNotice(`Email file opened: ${fileName}. Press "Check this message" when you are ready.`);
  };

  const showError = (message: string) => {
    setError(message);
    setNotice('');
  };

  const check = () => {
    if (text.trim() === '' && !details) {
      showError(EMPTY_MESSAGE_ERROR);
      setChecked(undefined);
      messageRef.current?.focus();
      return;
    }
    const input: AnalysisInput = {
      text,
      headers: details?.headerText ?? details?.headers,
      attachments: details?.attachments ?? [],
    };
    setError('');
    setChecked({ input, result: analyse(input) });
  };

  return (
    <section className="possession-check" aria-labelledby="possession-check-heading">
      <h2 id="possession-check-heading">Possession Check</h2>
      <p className="intro">Got a message that feels wrong? Paste it here and we will look for the ghosts hiding in it.</p>

      <div className="field">
        <label htmlFor="message">Paste the message you received</label>
        <p id="message-hint" className="hint">
          You can paste an email, SMS or WhatsApp message.
        </p>
        <textarea
          id="message"
          ref={messageRef}
          className="message-box"
          rows={8}
          value={text}
          spellCheck={false}
          aria-describedby={error === EMPTY_MESSAGE_ERROR ? 'message-hint message-error' : 'message-hint'}
          aria-invalid={error === EMPTY_MESSAGE_ERROR ? true : undefined}
          onChange={(event) => changeText(event.target.value)}
        />
      </div>

      <div className="input-options">
        <SamplePicker value={sampleId} onPick={pickSample} />
        <EmlPicker onLoaded={loadEmail} onError={showError} />
      </div>

      {details && (
        <EmailDetails
          details={details}
          onRemove={() => {
            setDetails(undefined);
            setChecked(undefined);
            setNotice('Email details removed.');
          }}
        />
      )}

      <p role="status" className="notice">
        {notice}
      </p>
      {error !== '' && (
        <p id="message-error" role="alert" className="error">
          {error}
        </p>
      )}

      <div className="check-row">
        <button type="button" className="button button-primary" onClick={check}>
          Check this message
        </button>
        <p className="privacy-note">
          Your message never leaves this device. It is checked right here in your browser and is not saved.
        </p>
      </div>

      {checked && <ResultPanel input={checked.input} result={checked.result} />}
    </section>
  );
}
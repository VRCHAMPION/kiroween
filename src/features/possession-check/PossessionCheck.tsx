import { useEffect, useRef, useState, type ClipboardEvent } from 'react';
import { SAMPLES } from '../../data/samples';
import { analyse, ensureDetectionData, isDetectionDataLoaded, type AnalysisInput, type AnalysisResult } from '../../detection';
import type { ParsedEmail } from '../../email/parse-eml';
import { firstImage } from '../../ocr/image-file';
import { readScreenshot } from '../../ocr/ocr';
import type { OcrReader } from '../../ocr/types';
import { EmailDetails, type LoadedDetails } from './EmailDetails';
import { EmlPicker } from './EmlPicker';
import { ResultPanel } from './ResultPanel';
import { SamplePicker } from './SamplePicker';
import { ScreenshotPicker } from './ScreenshotPicker';
import { useScreenshotReader } from './useScreenshotReader';
import './possession-check.css';

export const EMPTY_MESSAGE_ERROR = 'Paste a message, choose a sample, open an .eml file, or add a screenshot first.';
export const SCREENSHOT_READ_NOTICE =
  'We read this text from your screenshot. Please compare it with the screenshot and fix any mistakes, then press Check this message.';

const LINK = /\bhttps?:\/\/[^\s<>"'`]+/gi;
const countLinks = (text: string) => new Set(text.match(LINK) ?? []).size;

interface Checked {
  input: AnalysisInput;
  result: AnalysisResult;
}

interface Screenshot {
  preview: string;
  name: string;
}

interface PossessionCheckProps {
  /** Reads text from screenshots. Tests pass a fake; the app uses tesseract.js. */
  ocr?: OcrReader;
}

/** Images in a paste: browsers put them in `files`, `items`, or both. */
function pastedImage(event: ClipboardEvent): File | undefined {
  const data = event.clipboardData;
  if (!data) return undefined;
  const fromItems = Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
  return firstImage(data.files) ?? firstImage(fromItems);
}

export function PossessionCheck({ ocr = readScreenshot }: PossessionCheckProps) {
  const [text, setText] = useState('');
  const [details, setDetails] = useState<LoadedDetails | undefined>();
  const [sampleId, setSampleId] = useState('');
  const [checked, setChecked] = useState<Checked | undefined>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [screenshot, setScreenshot] = useState<Screenshot | undefined>();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [waiting, setWaiting] = useState(false);
  const latestText = useRef(text);
  useEffect(() => {
    latestText.current = text;
  }, [text]);

  const showError = (message: string) => {
    setError(message);
    setNotice('');
  };

  const shot = useScreenshotReader(ocr, {
    onStart: (preview, name) => setScreenshot({ preview, name }),
    onText: (read) => {
      setText(read);
      setDetails(undefined);
      setSampleId('');
      setChecked(undefined);
      setError('');
      setNotice(SCREENSHOT_READ_NOTICE);
      messageRef.current?.focus();
    },
    onError: (message) => {
      setScreenshot(undefined);
      showError(message);
    },
    onStopped: () => {
      setScreenshot(undefined);
      setError('');
      setNotice('Stopped reading the screenshot.');
    },
  });

  const startScreenshot = (file: File) => {
    setError('');
    setNotice('');
    setChecked(undefined);
    shot.read(file);
  };

  const changeText = (value: string) => {
    setText(value);
    setChecked(undefined);
    setSampleId('');
    setError('');
    if (value.trim() === '') {
      setDetails(undefined);
      setScreenshot(undefined);
    }
  };

  const pickSample = (id: string) => {
    setSampleId(id);
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) return;
    setText(sample.text);
    setScreenshot(undefined);
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
    setScreenshot(undefined);
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

  const check = () => {
    if (shot.reading || waiting) return;
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
    if (isDetectionDataLoaded()) {
      setChecked({ input, result: analyse(input) });
      return;
    }
    // The first check can arrive before the checking data has loaded; wait for it, then check the same message.
    setWaiting(true);
    setNotice('Getting the checker ready...');
    void ensureDetectionData().then(() => {
      setWaiting(false);
      setNotice('');
      if (latestText.current === text) setChecked({ input, result: analyse(input) });
    });
  };

  const onPaste = (event: ClipboardEvent<HTMLElement>) => {
    const image = pastedImage(event);
    if (!image) return;
    event.preventDefault();
    if (!shot.reading) startScreenshot(image);
  };

  return (
    <section className="possession-check" aria-labelledby="possession-check-heading" aria-busy={shot.reading || waiting} onPaste={onPaste}>
      <h2 id="possession-check-heading" tabIndex={-1}>
        Possession Check
      </h2>
      <p className="intro">Got a message that feels wrong? Paste it here and we will look for the ghosts hiding in it.</p>

      <div className="field">
        <label htmlFor="message">Paste the message you received</label>
        <p id="message-hint" className="hint">
          You can paste an email, SMS or WhatsApp message, or add a screenshot below.
        </p>
        <textarea
          id="message"
          ref={messageRef}
          className="message-box"
          rows={8}
          value={text}
          readOnly={shot.reading}
          spellCheck={false}
          aria-describedby={error === EMPTY_MESSAGE_ERROR ? 'message-hint message-error' : 'message-hint'}
          aria-invalid={error === EMPTY_MESSAGE_ERROR ? true : undefined}
          onChange={(event) => changeText(event.target.value)}
        />
      </div>

      <div className="input-options">
        <SamplePicker value={sampleId} onPick={pickSample} disabled={shot.reading} />
        <EmlPicker onLoaded={loadEmail} onError={showError} disabled={shot.reading} />
        <ScreenshotPicker reading={shot.reading} progress={shot.progress} onFile={startScreenshot} onStop={shot.stop} />
      </div>

      {screenshot && (
        <figure className="screenshot-preview">
          <img src={screenshot.preview} alt="Your screenshot" />
          <figcaption>Your screenshot: compare it with the text in the box.</figcaption>
        </figure>
      )}

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
        <button type="button" className="button button-primary" disabled={shot.reading || waiting} onClick={check}>
          Check this message
        </button>
        <p className="privacy-note">
          Your message never leaves this device. It is checked right here in your browser and is not saved. Screenshots are read here too.
        </p>
      </div>

      {checked && <ResultPanel input={checked.input} result={checked.result} />}
    </section>
  );
}
import { useRef, useState, type DragEvent } from 'react';
import { EmlParseError, parseEml, type ParsedEmail } from '../../email/parse-eml';

export const MAX_EML_BYTES = 5 * 1024 * 1024;

interface EmlPickerProps {
  onLoaded: (email: ParsedEmail, fileName: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

function readText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsText(file);
  });
}

export function EmlPicker({ onLoaded, onError, disabled = false }: EmlPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const load = async (file: File | undefined) => {
    if (!file) return;
    const looksLikeEml = /\.eml$/i.test(file.name) || file.type === 'message/rfc822';
    if (!looksLikeEml) {
      onError('That file is not an email file. Please choose a file that ends in .eml.');
      return;
    }
    if (file.size > MAX_EML_BYTES) {
      onError('That email file is too big to check (over 5 MB).');
      return;
    }
    try {
      onLoaded(parseEml(await readText(file)), file.name);
    } catch (error) {
      onError(
        error instanceof EmlParseError
          ? 'That file does not look like a saved email, so it could not be opened.'
          : 'That file could not be read. Please try again.',
      );
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    void load(event.dataTransfer?.files?.[0]);
  };

  return (
    <div
      className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
      data-testid="eml-dropzone"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <p className="dropzone-text">Have the email saved as a file? Drop the .eml file here, or</p>
      <button type="button" className="button" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Choose an .eml file
      </button>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".eml,message/rfc822"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="eml-input"
        onChange={(event) => {
          void load(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
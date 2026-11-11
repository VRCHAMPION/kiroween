import { useRef, useState, type DragEvent } from 'react';
import { firstImage } from '../../ocr/image-file';
import type { OcrProgress, OcrStage } from '../../ocr/types';
import { useViewSettings } from '../../view-context';
import { GhostIcon } from './ghosts/GhostIcon';

const STAGE_TEXT: Readonly<Record<OcrStage, string>> = {
  starting: 'Getting your screenshot ready.',
  'loading-reader': 'Getting the reader ready. The first time can take a little while.',
  'loading-language': 'Learning to read English.',
  reading: 'Reading the words in your screenshot.',
};

interface ScreenshotPickerProps {
  reading: boolean;
  progress: OcrProgress;
  disabled?: boolean;
  onFile: (file: File) => void;
  onStop: () => void;
}

/** "Choose a screenshot" button, drop zone, and the friendly progress shown while it is read. */
export function ScreenshotPicker({ reading, progress, disabled = false, onFile, onStop }: ScreenshotPickerProps) {
  const { view } = useViewSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = reading || disabled;

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = firstImage(event.dataTransfer?.files) ?? event.dataTransfer?.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={dragging ? 'dropzone dropzone-active screenshot-zone' : 'dropzone screenshot-zone'}
      data-testid="screenshot-dropzone"
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <p className="dropzone-text">Got the message on SMS or WhatsApp? Take a screenshot and add it here.</p>
      <button type="button" className="button" disabled={busy} onClick={() => inputRef.current?.click()}>
        Choose a screenshot
      </button>
      <p className="hint">You can also drop a picture here, or paste one with Ctrl+V.</p>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="screenshot-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onFile(file);
        }}
      />
      {reading && (
        <div className="reading-state" data-testid="reading-state">
          {view === 'haunted' && (
            <p className="reading-spirits">
              <span className="reading-ghost">
                <GhostIcon />
              </span>
              The spirits are reading your screenshot
            </p>
          )}
          <p role="status" className="reading-stage">
            {STAGE_TEXT[progress.stage]}
          </p>
          <div className="reading-bar">
            <progress max={100} value={progress.percent} aria-label="Reading the screenshot" />
            <span className="reading-percent" aria-hidden="true">
              {progress.percent}%
            </span>
          </div>
          <button type="button" className="button button-secondary" onClick={onStop}>
            Stop reading
          </button>
        </div>
      )}
    </div>
  );
}
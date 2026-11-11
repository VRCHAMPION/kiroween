import { useCallback, useEffect, useRef, useState } from 'react';
import { checkImageFile } from '../../ocr/image-file';
import { OcrCancelled, type OcrProgress, type OcrReader } from '../../ocr/types';

export const SCREENSHOT_ERRORS = {
  'wrong-type': 'That file is not a picture. Please choose a screenshot, such as a PNG or JPG file.',
  'too-big': 'That picture is too big to read (over 10 MB). Please choose a smaller screenshot.',
  'no-words': 'We could not find any words in this screenshot. Try a clearer screenshot, or type the message into the box instead.',
  failed: 'Sorry, the screenshot could not be read. You can still type or paste the message into the box.',
} as const;

export interface ScreenshotHandlers {
  onStart: (preview: string, name: string) => void;
  onText: (text: string) => void;
  onError: (message: string) => void;
  onStopped: () => void;
}

export interface ScreenshotReading {
  reading: boolean;
  progress: OcrProgress;
  read: (file: File) => void;
  stop: () => void;
}

const START: OcrProgress = { stage: 'starting', percent: 0 };

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

/** Runs one screenshot read at a time, with progress, cancel, and plain-language errors. */
export function useScreenshotReader(ocr: OcrReader, handlers: ScreenshotHandlers): ScreenshotReading {
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<OcrProgress>(START);
  const controller = useRef<AbortController | undefined>(undefined);
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  useEffect(() => () => controller.current?.abort(), []);

  const read = useCallback(
    (file: File) => {
      const check = checkImageFile(file);
      if (check !== 'ok') {
        latest.current.onError(SCREENSHOT_ERRORS[check]);
        return;
      }
      controller.current?.abort();
      const own = new AbortController();
      controller.current = own;
      setReading(true);
      setProgress(START);
      const isCurrent = () => controller.current === own;

      void readAsDataUrl(file)
        .then((preview) => {
          if (isCurrent()) latest.current.onStart(preview, file.name || 'pasted screenshot');
        })
        .catch(() => undefined);

      ocr(
        file,
        (p) => {
          if (isCurrent()) setProgress(p);
        },
        own.signal,
      )
        .then((text) => {
          if (!isCurrent()) return;
          if (text.trim() === '') latest.current.onError(SCREENSHOT_ERRORS['no-words']);
          else latest.current.onText(text);
        })
        .catch((error: unknown) => {
          if (!isCurrent()) return;
          if (error instanceof OcrCancelled) latest.current.onStopped();
          else latest.current.onError(SCREENSHOT_ERRORS.failed);
        })
        .finally(() => {
          if (!isCurrent()) return;
          controller.current = undefined;
          setReading(false);
        });
    },
    [ocr],
  );

  const stop = useCallback(() => controller.current?.abort(), []);

  return { reading, progress, read, stop };
}
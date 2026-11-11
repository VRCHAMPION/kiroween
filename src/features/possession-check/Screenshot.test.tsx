import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OcrCancelled, OcrFailed, type OcrProgress, type OcrReader } from '../../ocr/types';
import { ViewContext } from '../../view-context';
import { PossessionCheck, SCREENSHOT_READ_NOTICE } from './PossessionCheck';
import { SCREENSHOT_ERRORS } from './useScreenshotReader';

beforeEach(() => {
  window.localStorage.clear();
});

/** A fake OCR reader the test drives by hand: report progress, then finish, fail or be stopped. */
function fakeReader() {
  let progress: (p: OcrProgress) => void = () => undefined;
  let resolve: (text: string) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  let signal: AbortSignal | undefined;
  const reader = vi.fn<OcrReader>((_image, onProgress, s) => {
    progress = onProgress;
    signal = s;
    return new Promise<string>((res, rej) => {
      resolve = res;
      reject = rej;
      s.addEventListener('abort', () => rej(new OcrCancelled()));
    });
  });
  return {
    reader,
    signal: () => signal,
    progress: (p: OcrProgress) => act(() => progress(p)),
    finish: async (text: string) => {
      await act(async () => resolve(text));
    },
    fail: async () => {
      await act(async () => reject(new OcrFailed(new Error('boom'))));
    },
  };
}

const png = (name = 'chat.png') => new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' });
const messageBox = () => screen.getByLabelText('Paste the message you received') as HTMLTextAreaElement;
const checkButton = () => screen.getByRole('button', { name: 'Check this message' }) as HTMLButtonElement;
const shotButton = () => screen.getByRole('button', { name: 'Choose a screenshot' }) as HTMLButtonElement;
const readingStatus = () => within(screen.getByTestId('reading-state')).getByRole('status');

function renderCheck(reader: OcrReader, view: 'mortal' | 'haunted' = 'mortal') {
  return render(
    <ViewContext.Provider value={{ view, reducedMotion: false }}>
      <PossessionCheck ocr={reader} />
    </ViewContext.Provider>,
  );
}

describe('Screenshots: reading', () => {
  it('reads a picked screenshot with friendly progress, then lets the user fix the text before checking', async () => {
    const fake = fakeReader();
    const user = userEvent.setup();
    renderCheck(fake.reader);
    await user.upload(screen.getByTestId('screenshot-input'), png());

    expect(fake.reader).toHaveBeenCalledTimes(1);
    expect(readingStatus().textContent).toBe('Getting your screenshot ready.');
    expect(checkButton().disabled).toBe(true);
    expect(shotButton().disabled).toBe(true);
    expect(messageBox().readOnly).toBe(true);
    expect((await screen.findByAltText('Your screenshot')).getAttribute('src')).toMatch(/^data:image\/png;base64,/);

    fake.progress({ stage: 'loading-reader', percent: 10 });
    expect(readingStatus().textContent).toBe('Getting the reader ready. The first time can take a little while.');
    fake.progress({ stage: 'reading', percent: 55 });
    const statusNode = readingStatus();
    expect(statusNode.textContent).toBe('Reading the words in your screenshot.');
    expect((screen.getByRole('progressbar', { name: 'Reading the screenshot' }) as HTMLProgressElement).value).toBe(55);

    // A new percentage within the same stage changes the bar, not the announced words.
    fake.progress({ stage: 'reading', percent: 80 });
    expect(readingStatus()).toBe(statusNode);
    expect(readingStatus().textContent).toBe('Reading the words in your screenshot.');
    expect((screen.getByRole('progressbar') as HTMLProgressElement).value).toBe(80);

    await fake.finish('Your KYC has expired. Update within 24 hours at https://bit.ly/kyc-1');
    expect(screen.queryByTestId('reading-state')).toBeNull();
    expect(messageBox().value).toBe('Your KYC has expired. Update within 24 hours at https://bit.ly/kyc-1');
    expect(messageBox().readOnly).toBe(false);
    expect(document.activeElement).toBe(messageBox());
    expect(screen.getAllByRole('status').some((s) => s.textContent === SCREENSHOT_READ_NOTICE)).toBe(true);
    expect(screen.queryByRole('region', { name: 'Result' })).toBeNull();

    await user.type(messageBox(), ' Thanks');
    await user.click(checkButton());
    expect(within(screen.getByRole('region', { name: 'Result' })).getByText('Likely scam')).toBeTruthy();
  });

  it('stops reading when asked and keeps the message', async () => {
    const fake = fakeReader();
    const user = userEvent.setup();
    renderCheck(fake.reader);
    await user.upload(screen.getByTestId('screenshot-input'), png());
    await user.click(screen.getByRole('button', { name: 'Stop reading' }));
    await waitFor(() => expect(screen.queryByTestId('reading-state')).toBeNull());
    expect(fake.signal()?.aborted).toBe(true);
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Stopped reading the screenshot.')).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(shotButton().disabled).toBe(false);
    expect(screen.queryByAltText('Your screenshot')).toBeNull();
  });

  it('shows the spirits reading in Haunted view', async () => {
    const fake = fakeReader();
    const user = userEvent.setup();
    renderCheck(fake.reader, 'haunted');
    await user.upload(screen.getByTestId('screenshot-input'), png());
    expect(screen.getByText('The spirits are reading your screenshot')).toBeTruthy();
  });
});

describe('Screenshots: drop and paste', () => {
  it('reads a dropped image', () => {
    const fake = fakeReader();
    renderCheck(fake.reader);
    fireEvent.drop(screen.getByTestId('screenshot-dropzone'), { dataTransfer: { files: [png('dropped.jpg')] } });
    expect(fake.reader).toHaveBeenCalledTimes(1);
  });

  it('reads an image pasted anywhere on the screen', () => {
    const fake = fakeReader();
    renderCheck(fake.reader);
    const notPrevented = fireEvent.paste(messageBox(), { clipboardData: { files: [png('image.png')], items: [], getData: () => '' } });
    expect(notPrevented).toBe(false);
    expect(fake.reader).toHaveBeenCalledTimes(1);
  });

  it('reads an image that a browser puts only in clipboard items', () => {
    const fake = fakeReader();
    renderCheck(fake.reader);
    const file = png('image.png');
    fireEvent.paste(screen.getByRole('region', { name: 'Possession Check' }), {
      clipboardData: { files: [], items: [{ kind: 'file', getAsFile: () => file }], getData: () => '' },
    });
    expect(fake.reader).toHaveBeenCalledTimes(1);
  });

  it('leaves normal text paste alone', () => {
    const fake = fakeReader();
    renderCheck(fake.reader);
    const notPrevented = fireEvent.paste(messageBox(), { clipboardData: { files: [], items: [{ kind: 'string', getAsFile: () => null }], getData: () => 'hello' } });
    expect(notPrevented).toBe(true);
    expect(fake.reader).not.toHaveBeenCalled();
  });
});

describe('Screenshots: errors', () => {
  it('rejects files that are not pictures and keeps the message', async () => {
    const fake = fakeReader();
    const user = userEvent.setup();
    renderCheck(fake.reader);
    await user.type(messageBox(), 'keep me');
    fireEvent.drop(screen.getByTestId('screenshot-dropzone'), { dataTransfer: { files: [new File(['%PDF'], 'bill.pdf', { type: 'application/pdf' })] } });
    expect((await screen.findByRole('alert')).textContent).toBe(SCREENSHOT_ERRORS['wrong-type']);
    expect(fake.reader).not.toHaveBeenCalled();
    expect(messageBox().value).toBe('keep me');
  });

  it('rejects pictures over 10 MB', async () => {
    const fake = fakeReader();
    renderCheck(fake.reader);
    const big = png('huge.png');
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 });
    fireEvent.drop(screen.getByTestId('screenshot-dropzone'), { dataTransfer: { files: [big] } });
    expect((await screen.findByRole('alert')).textContent).toBe(SCREENSHOT_ERRORS['too-big']);
    expect(fake.reader).not.toHaveBeenCalled();
  });

  it('says so when no words are found', async () => {
    const fake = fakeReader();
    const user = userEvent.setup();
    renderCheck(fake.reader);
    await user.upload(screen.getByTestId('screenshot-input'), png());
    await fake.finish('   ');
    expect(screen.getByRole('alert').textContent).toBe(SCREENSHOT_ERRORS['no-words']);
    expect(messageBox().value).toBe('');
  });

  it('says so when the reader fails', async () => {
    const fake = fakeReader();
    const user = userEvent.setup();
    renderCheck(fake.reader);
    await user.upload(screen.getByTestId('screenshot-input'), png());
    await fake.fail();
    expect(screen.getByRole('alert').textContent).toBe(SCREENSHOT_ERRORS.failed);
    expect(checkButton().disabled).toBe(false);
  });
});
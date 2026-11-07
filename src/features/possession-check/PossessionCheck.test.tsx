import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { SAMPLES } from '../../data/samples';
import { PHISHING_EML } from '../../email/test-fixtures';
import { EMPTY_MESSAGE_ERROR, PossessionCheck } from './PossessionCheck';

beforeEach(() => {
  window.localStorage.clear();
});

const messageBox = () => screen.getByLabelText('Paste the message you received') as HTMLTextAreaElement;
const checkButton = () => screen.getByRole('button', { name: 'Check this message' });
const resultPanel = () => screen.getByRole('region', { name: 'Result' });
async function pasteMessage(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.click(messageBox());
  await user.paste(value);
}
const emlFile = (content = PHISHING_EML, name = 'statement.eml') => new File([content], name, { type: 'message/rfc822' });

async function violations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

describe('Possession Check: input', () => {
  it('shows the labelled message box, sample menu, file button, check button and privacy note', () => {
    render(<PossessionCheck />);
    expect(messageBox().getAttribute('rows')).toBe('8');
    const menu = screen.getByLabelText('Try a sample') as HTMLSelectElement;
    expect(menu.tagName).toBe('SELECT');
    expect(menu.options).toHaveLength(SAMPLES.length + 1);
    expect(screen.getByRole('button', { name: 'Choose an .eml file' })).toBeTruthy();
    expect(checkButton()).toBeTruthy();
    expect(screen.getByText(/never leaves this device/)).toBeTruthy();
  });

  it('shows an alert and no result when checking an empty message', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.click(checkButton());
    expect(screen.getByRole('alert').textContent).toBe(EMPTY_MESSAGE_ERROR);
    expect(screen.queryByRole('region', { name: 'Result' })).toBeNull();
    expect(document.activeElement).toBe(messageBox());
    expect(messageBox().getAttribute('aria-invalid')).toBe('true');
  });
});

describe('Possession Check: checking a pasted message', () => {
  const scam = 'Your KYC has expired. Update within 24 hours at https://bit.ly/kyc-99 or your account will be blocked.';

  it('shows the verdict, score, numbered cards and highlighted exact words', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await pasteMessage(user, scam);
    await user.click(checkButton());

    const panel = resultPanel();
    expect(within(panel).getByText('Likely scam')).toBeTruthy();
    expect(panel.querySelector('svg[data-shape="octagon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(within(panel).getByText(/Haunt score:/).textContent).toMatch(/Haunt score: \d+ out of 100/);
    expect(within(panel).getByRole('meter', { name: 'Haunt score' })).toBeTruthy();
    expect(within(panel).getByText(/never a guarantee/)).toBeTruthy();

    const marks = [...panel.querySelectorAll('mark')].map((m) => m.textContent);
    expect(marks.join('|')).toContain('KYC has expired');
    expect(marks.join('|')).toContain('within 24 hours');
    expect(marks.join('|')).toContain('https://bit.ly/kyc-99');
    expect(marks.join('|')).toContain('account will be blocked');

    const cards = within(panel).getAllByRole('listitem');
    expect(cards.length).toBe(4);
    expect(within(cards[0]).getByRole('heading', { level: 4 }).textContent).toContain('1');
    expect(cards[0].textContent).toContain('KYC has expired');
    expect(cards[0].textContent).toContain('Found in the message');
    expect(panel.textContent).toContain('(red flag 1)');
  });

  it('moves focus to the result heading after a check', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await pasteMessage(user, scam);
    await user.click(checkButton());
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Result' }));
  });

  it('clears the result when the message is edited', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await pasteMessage(user, scam);
    await user.click(checkButton());
    expect(resultPanel()).toBeTruthy();
    await user.type(messageBox(), '!');
    expect(screen.queryByRole('region', { name: 'Result' })).toBeNull();
  });

  it('says no warning signs were found for a calm message and still hedges', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await pasteMessage(user, 'Hi Ma, reached Pune safely. I will call you after dinner.');
    await user.click(checkButton());
    const panel = resultPanel();
    expect(within(panel).getByText('Looks safe')).toBeTruthy();
    expect(panel.querySelector('svg[data-shape="circle"]')).not.toBeNull();
    expect(within(panel).getByText('We found no warning signs in this message.')).toBeTruthy();
    expect(within(panel).getByText(/can be wrong/)).toBeTruthy();
    expect(panel.querySelectorAll('mark')).toHaveLength(0);
  });

  it('renders message text as plain text, never as HTML', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    const html = '<img src=x onerror=alert(1)> Your KYC has expired';
    fireEvent.change(messageBox(), { target: { value: html } });
    await user.click(checkButton());
    expect(resultPanel().querySelector('img')).toBeNull();
    expect(resultPanel().textContent).toContain('<img src=x onerror=alert(1)>');
  });
});

describe('Possession Check: samples', () => {
  it.each(SAMPLES.map((s) => [s.id, s] as const))('%s loads and gets its expected verdict', async (_id, sample) => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.selectOptions(screen.getByLabelText('Try a sample'), sample.id);
    expect(messageBox().value).toBe(sample.text);
    expect(screen.getByRole('status').textContent).toContain(sample.title);
    await user.click(checkButton());
    const title = { 'likely scam': 'Likely scam', suspicious: 'Suspicious', 'looks safe': 'Looks safe' }[sample.expectedVerdict];
    expect(within(resultPanel()).getByText(title)).toBeTruthy();
  });

  it('loads email details for an email sample and highlights header and attachment flags', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.selectOptions(screen.getByLabelText('Try a sample'), 'scam-bank-link-mismatch');
    const details = screen.getByRole('region', { name: /Email details from/ });
    expect(details.textContent).toContain('statements@vandana-bank-alerts.example');
    expect(details.textContent).toContain('Statement_Verification.html');
    await user.click(checkButton());
    const panel = resultPanel();
    const marks = [...panel.querySelectorAll('mark')].map((m) => m.textContent);
    expect(marks).toContain('dkim=fail');
    expect(marks).toContain('Statement_Verification.html');
    expect(panel.textContent).toContain('Found in the email details');
    expect(panel.textContent).toContain('Found in the attachment name Statement_Verification.html');
  });

  it('removes email details on request', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.selectOptions(screen.getByLabelText('Try a sample'), 'scam-paypal-homoglyph');
    await user.click(screen.getByRole('button', { name: 'Remove email details' }));
    expect(screen.queryByRole('region', { name: /Email details from/ })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Email details removed.');
  });

  it('removes email details when the message box is emptied', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.selectOptions(screen.getByLabelText('Try a sample'), 'scam-paypal-homoglyph');
    await user.clear(messageBox());
    expect(screen.queryByRole('region', { name: /Email details from/ })).toBeNull();
  });
});

describe('Possession Check: .eml files', () => {
  it('opens a picked .eml file and checks headers, body and attachments', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.upload(screen.getByTestId('eml-input'), emlFile());
    await waitFor(() => expect(messageBox().value).toContain('Your KYC has expired'));
    const details = screen.getByRole('region', { name: 'Email details from statement.eml' });
    expect(details.textContent).toContain('Your e-statement \u20b9 notice');
    expect(details.textContent).toContain('VB_Update.apk');
    expect(within(details).getByText('2')).toBeTruthy();

    await user.click(checkButton());
    const panel = resultPanel();
    expect(within(panel).getByText('Likely scam')).toBeTruthy();
    const marks = [...panel.querySelectorAll('mark')].map((m) => m.textContent);
    expect(marks).toEqual(expect.arrayContaining(['https://www.vandanabank.example/login', 'spf=fail', 'dmarc=fail', 'VB_Update.apk']));
  });

  it('opens a dropped .eml file', async () => {
    render(<PossessionCheck />);
    fireEvent.drop(screen.getByTestId('eml-dropzone'), { dataTransfer: { files: [emlFile()] } });
    await waitFor(() => expect(messageBox().value).toContain('Your KYC has expired'));
    expect(screen.getByRole('status').textContent).toContain('statement.eml');
  });

  it('rejects files that are not .eml and keeps the message', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.type(messageBox(), 'keep me');
    fireEvent.drop(screen.getByTestId('eml-dropzone'), {
      dataTransfer: { files: [new File(['MZ'], 'invoice.exe', { type: 'application/octet-stream' })] },
    });
    expect((await screen.findByRole('alert')).textContent).toMatch(/not an email file/);
    expect(messageBox().value).toBe('keep me');
  });

  it('rejects .eml files without email headers', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.upload(screen.getByTestId('eml-input'), emlFile('just text, no headers', 'broken.eml'));
    expect((await screen.findByRole('alert')).textContent).toMatch(/does not look like a saved email/);
    expect(messageBox().value).toBe('');
  });

  it('opens the file picker from the visible button', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    const input = screen.getByTestId('eml-input') as HTMLInputElement;
    let opened = false;
    input.addEventListener('click', () => {
      opened = true;
    });
    await user.click(screen.getByRole('button', { name: 'Choose an .eml file' }));
    expect(opened).toBe(true);
  });
});

describe('Possession Check: keyboard and accessibility', () => {
  it('can be used with the keyboard alone', async () => {
    const user = userEvent.setup();
    render(<PossessionCheck />);
    await user.tab();
    expect(document.activeElement).toBe(messageBox());
    await user.keyboard('Share the OTP within 24 hours');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Try a sample'));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Choose an .eml file' }));
    await user.tab();
    expect(document.activeElement).toBe(checkButton());
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Result' }));
    expect(within(resultPanel()).getByText('Likely scam')).toBeTruthy();
  });

  it.each(['mortal', 'haunted'])('has no axe violations before and after a check in %s view', async (view) => {
    window.localStorage.setItem('phantom-inbox:view', view);
    const user = userEvent.setup();
    const { container } = render(<App />);
    expect(await violations(container)).toEqual([]);
    await user.selectOptions(screen.getByLabelText('Try a sample'), 'scam-bank-link-mismatch');
    await user.click(checkButton());
    expect(await violations(container)).toEqual([]);
  });
});
describe('Possession Check: Haunted view', () => {
  const ghosts = () => screen.queryAllByRole('button', { name: /^Red flag \d+ / });
  const candle = () => document.querySelector('[data-testid="score-candle"]');

  async function checkSample(user: ReturnType<typeof userEvent.setup>, id: string) {
    await user.selectOptions(screen.getByLabelText('Try a sample'), id);
    await user.click(checkButton());
  }

  it('turns every red flag into a ghost and shows the score candle', async () => {
    window.localStorage.setItem('phantom-inbox:view', 'haunted');
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByTestId('haunted-backdrop').getAttribute('aria-hidden')).toBe('true');
    await checkSample(user, 'scam-paypal-homoglyph');
    const cards = resultPanel().querySelectorAll('.flag-card');
    expect(ghosts()).toHaveLength(cards.length);
    expect(candle()?.getAttribute('aria-hidden')).toBe('true');
    expect(within(resultPanel()).getByRole('meter', { name: 'Haunt score' })).toBeTruthy();
    expect(within(resultPanel()).getByText('The candle burns down as the haunt score rises.')).toBeTruthy();
    expect(screen.getAllByTestId('lookalike-char').map((e) => e.textContent)).toContain('1');
  });

  it('shows no ghosts, candle or backdrop in Mortal view', async () => {
    const user = userEvent.setup();
    render(<App />);
    await checkSample(user, 'scam-paypal-homoglyph');
    expect(ghosts()).toHaveLength(0);
    expect(candle()).toBeNull();
    expect(screen.queryByTestId('haunted-backdrop')).toBeNull();
    expect(resultPanel().querySelectorAll('mark').length).toBeGreaterThan(0);
  });

  it('burns the candle lower for a higher score', async () => {
    window.localStorage.setItem('phantom-inbox:view', 'haunted');
    const user = userEvent.setup();
    render(<App />);
    await checkSample(user, 'genuine-family-message');
    const safeWax = Number(candle()?.getAttribute('data-wax'));
    await checkSample(user, 'scam-digital-arrest');
    const scamWax = Number(candle()?.getAttribute('data-wax'));
    expect(safeWax).toBe(96);
    expect(scamWax).toBeLessThan(safeWax);
  });

  it('melts the candle only when motion is allowed', async () => {
    window.localStorage.setItem('phantom-inbox:view', 'haunted');
    const user = userEvent.setup();
    const first = render(<App />);
    await checkSample(user, 'scam-kyc-expiry');
    expect(candle()?.querySelectorAll('animate, animateTransform').length).toBeGreaterThan(0);
    first.unmount();

    window.localStorage.setItem('phantom-inbox:reduced-motion', 'true');
    render(<App />);
    await checkSample(user, 'scam-kyc-expiry');
    expect(candle()?.querySelectorAll('animate, animateTransform')).toHaveLength(0);
    expect(document.querySelector('.app')?.getAttribute('data-reduced-motion')).toBe('true');
  });

  it('keeps the result when switching views and remembers the view', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await checkSample(user, 'scam-bank-link-mismatch');
    const toggle = screen.getByRole('switch', { name: 'Haunted view' });
    await user.click(toggle);
    expect(within(resultPanel()).getByText('Likely scam')).toBeTruthy();
    expect(ghosts().length).toBeGreaterThan(0);
    expect(messageBox().value).toContain('Vandana Bank');
    first.unmount();

    render(<App />);
    expect(document.querySelector('.app')?.getAttribute('data-view')).toBe('haunted');
    expect(screen.getByRole('switch', { name: 'Haunted view' }).getAttribute('aria-checked')).toBe('true');
  });

  it('has no axe violations with a ghost whisper open', async () => {
    window.localStorage.setItem('phantom-inbox:view', 'haunted');
    const user = userEvent.setup();
    const { container } = render(<App />);
    await checkSample(user, 'scam-bank-link-mismatch');
    const [ghost] = ghosts();
    await user.click(ghost);
    expect(ghost.getAttribute('aria-expanded')).toBe('true');
    expect(await violations(container)).toEqual([]);
  });
});
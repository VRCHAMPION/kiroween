import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../App';
import { SAMPLES, type SampleMessage, type ScamTopic } from '../../data/samples';
import { ViewContext } from '../../view-context';
import { feedbackFor, TOPIC_TIPS } from './feedback';
import { isScamSample, newGame, type Guess } from './game';
import { Seance } from './Seance';
import { seeded } from './test-random';

beforeEach(() => {
  window.localStorage.clear();
});

const SEED = 2026;
const SHAMING = /\b(wrong|stupid|silly|dumb|fail\w*|fool\w*|careless|mistake\w*)\b/i;
const roundsFor = (seed = SEED) => newGame(SAMPLES, seeded(seed)).rounds;
const right = (s: SampleMessage): Guess => (isScamSample(s) ? 'scam' : 'real');
const opposite = (s: SampleMessage): Guess => (isScamSample(s) ? 'real' : 'scam');

function renderSeance(view: 'mortal' | 'haunted' = 'mortal', options: { seed?: number; active?: boolean } = {}) {
  return render(
    <ViewContext.Provider value={{ view, reducedMotion: false }}>
      <Seance random={seeded(options.seed ?? SEED)} active={options.active ?? true} />
    </ViewContext.Provider>,
  );
}

const roundHeading = () => screen.getByRole('heading', { level: 3, name: /^Message \d+ of 10$/ });
const messageArea = () => document.querySelector('.round-message') as HTMLElement;
const feedbackRegion = () => document.querySelector('.seance-feedback') as HTMLElement;
const status = () => document.querySelector('.seance-status') as HTMLElement;
const choose = (user: ReturnType<typeof userEvent.setup>, guess: Guess) => user.click(screen.getByRole('button', { name: guess === 'scam' ? 'Scam' : 'Real' }));

async function violations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

describe('S\u00e9ance: a full game', () => {
  it('plays 10 rounds with the mouse, explains each answer and ends kindly', async () => {
    const rounds = roundsFor();
    const user = userEvent.setup();
    renderSeance();

    for (let i = 0; i < 10; i += 1) {
      expect(roundHeading().textContent).toBe(`Message ${i + 1} of 10`);
      expect(messageArea().textContent).toBe(rounds[i].text);
      expect(screen.getByRole('group', { name: 'Real or scam?' })).toBeTruthy();
      await choose(user, right(rounds[i]));

      const region = screen.getByRole('region', { name: 'Well spotted!' });
      expect(document.activeElement).toBe(within(region).getByRole('heading', { name: 'Well spotted!' }));
      expect(status().textContent).toContain(`You have ${i + 1} right out of ${i + 1} so far.`);
      expect(within(region).getByText(isScamSample(rounds[i]) ? 'What gives it away' : 'Why it is safe')).toBeTruthy();
      expect(region.textContent).toMatch(/Phantom Inbox's check: (Likely scam|Suspicious|Looks safe), haunt score \d+ out of 100\./);
      await user.click(within(region).getByRole('button', { name: i === 9 ? 'See your results' : 'Next message' }));
      if (i < 9) expect(document.activeElement).toBe(roundHeading());
    }

    const end = screen.getByRole('region', { name: 'Your s\u00e9ance is complete' });
    expect(document.activeElement).toBe(within(end).getByRole('heading', { level: 3 }));
    expect(end.textContent).toContain('You got 10 out of 10 right.');
    expect(end.textContent).toContain('A perfect s\u00e9ance! You spotted every one.');
    expect(within(end).getByText('You did not miss a single scam.')).toBeTruthy();
    expect(status().textContent).toBe('Your s\u00e9ance is complete. You got 10 out of 10 right.');
  });

  it('starts a fresh game with Play again', async () => {
    const random = seeded(SEED);
    newGame(SAMPLES, random);
    const second = newGame(SAMPLES, random).rounds;
    const first = roundsFor();
    const user = userEvent.setup();
    renderSeance();
    for (const round of first) {
      await user.keyboard(right(round) === 'scam' ? 's' : 'r');
      await user.keyboard('{Enter}');
    }
    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(document.activeElement).toBe(roundHeading());
    expect(roundHeading().textContent).toBe('Message 1 of 10');
    expect(messageArea().textContent).toBe(second[0].text);
    expect(screen.getByText('Message 1 of 10 \u00b7 0 right so far')).toBeTruthy();
  });
});

describe('S\u00e9ance: kind feedback for every answer', () => {
  it('shows missed ghosts on the exact words, calm reasons for real messages, and the missed scam types', async () => {
    const rounds = roundsFor();
    const user = userEvent.setup();
    const { container } = renderSeance();

    for (let i = 0; i < 10; i += 1) {
      const round = rounds[i];
      await choose(user, opposite(round));
      const region = feedbackRegion();
      const fb = feedbackFor(round, opposite(round));
      // Our own words to the player; quoted message words such as "dmarc=fail" are not about the player.
      const ownWords = `${region.querySelector('h3')?.textContent} ${region.querySelector('.feedback-message')?.textContent}`;
      expect(ownWords).not.toMatch(SHAMING);
      expect(status().textContent).toContain(`You have 0 right out of ${i + 1} so far.`);

      if (isScamSample(round)) {
        expect(within(region).getByRole('heading', { name: 'This one was a scam' })).toBeTruthy();
        expect(region.textContent).toContain('It is an easy one to miss');
        const marked = [...messageArea().querySelectorAll('mark')].map((m) => m.textContent).join('');
        for (const { flag } of fb.flags.filter((f) => f.flag.source === 'body')) expect(marked).toContain(flag.text);
        for (const { flag } of fb.flags) {
          expect(region.textContent).toContain(flag.reason);
          expect(region.textContent).toContain(flag.text);
        }
      } else {
        expect(within(region).getByRole('heading', { name: 'This one was real' })).toBeTruthy();
        expect(region.textContent).toContain('Being careful is good');
        const reasons = within(region).getAllByRole('listitem').map((li) => li.textContent);
        expect(reasons).toEqual([...(round.safeReasons ?? [])]);
        expect(messageArea().querySelectorAll('mark')).toHaveLength(0);
      }
      await user.click(within(region).getByRole('button', { name: /Next message|See your results/ }));
    }

    const end = screen.getByRole('region', { name: 'Your s\u00e9ance is complete' });
    expect(end.textContent).toContain('You got 0 out of 10 right.');
    expect(end.textContent).toContain('Thank you for practising.');
    expect(end.textContent).not.toMatch(SHAMING);
    const missed = [...new Set(rounds.filter(isScamSample).map((r) => r.topic as ScamTopic))];
    const items = within(end).getAllByRole('listitem');
    expect(items).toHaveLength(missed.length);
    missed.forEach((topic, i) => {
      expect(items[i].textContent).toBe(`${TOPIC_TIPS[topic].label}. ${TOPIC_TIPS[topic].tip}`);
    });
    const real = rounds.filter((r) => !isScamSample(r)).length;
    expect(end.textContent).toContain(real === 1 ? 'You were extra careful with 1 real message.' : `You were extra careful with ${real} real messages.`);
    expect(container.textContent).toContain('not saved');
  });
});

describe('S\u00e9ance: keyboard play', () => {
  it('plays a whole game with R, S and Enter', async () => {
    const rounds = roundsFor();
    const user = userEvent.setup();
    renderSeance();
    expect(screen.getByRole('button', { name: 'Real' }).getAttribute('aria-keyshortcuts')).toBe('R');
    expect(screen.getByRole('button', { name: 'Scam' }).getAttribute('aria-keyshortcuts')).toBe('S');
    expect(screen.getByText('Keyboard: press R for Real, S for Scam, and Enter for the next message.')).toBeTruthy();

    for (let i = 0; i < 10; i += 1) {
      await user.keyboard(right(rounds[i]) === 'scam' ? (i % 2 ? 'S' : 's') : i % 2 ? 'R' : 'r');
      expect(feedbackRegion()).not.toBeNull();
      await user.keyboard('{Enter}');
    }
    expect(screen.getByRole('region', { name: 'Your s\u00e9ance is complete' }).textContent).toContain('You got 10 out of 10 right.');
  });

  it('ignores shortcuts with modifier keys, Enter while asking, and keys on an inactive screen', async () => {
    const user = userEvent.setup();
    renderSeance();
    await user.keyboard('{Control>}s{/Control}');
    await user.keyboard('{Alt>}r{/Alt}');
    await user.keyboard('{Enter}');
    expect(feedbackRegion()).toBeNull();
    expect(roundHeading().textContent).toBe('Message 1 of 10');
  });

  it('does nothing when the screen is not showing', async () => {
    const user = userEvent.setup();
    renderSeance('mortal', { active: false });
    await user.keyboard('s');
    expect(feedbackRegion()).toBeNull();
  });

  it('moves on only once when Enter is pressed on the Next button', async () => {
    const user = userEvent.setup();
    renderSeance();
    await user.keyboard('s');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next message' }));
    await user.keyboard('{Enter}');
    expect(roundHeading().textContent).toBe('Message 2 of 10');
    expect(feedbackRegion()).toBeNull();
  });
});

describe('S\u00e9ance: Haunted view', () => {
  it('lights a candle for each right answer and lets missed ghosts drift up from the words', async () => {
    const rounds = roundsFor();
    const user = userEvent.setup();
    renderSeance('haunted');
    const table = screen.getByTestId('seance-table');
    expect(table.getAttribute('aria-hidden')).toBe('true');
    const lit = () => table.querySelectorAll('.seance-candle.is-lit').length;
    expect(screen.getAllByTestId('seance-candle')).toHaveLength(10);
    expect(lit()).toBe(0);

    await user.keyboard(right(rounds[0]) === 'scam' ? 's' : 'r');
    expect(lit()).toBe(1);
    await user.keyboard('{Enter}');

    // Answer correctly until a scam with flagged words comes up, then miss it.
    let i = 1;
    while (!(isScamSample(rounds[i]) && feedbackFor(rounds[i], 'real').flags.some((f) => f.flag.source === 'body'))) {
      await user.keyboard(right(rounds[i]) === 'scam' ? 's' : 'r');
      await user.keyboard('{Enter}');
      i += 1;
    }
    const before = lit();
    await user.keyboard('r');
    expect(lit()).toBe(before);
    const words = screen.getByTestId('seance-ghost-words');
    expect(words.classList.contains('seance-missed')).toBe(true);
    const bodyFlags = feedbackFor(rounds[i], 'real').flags.filter((f) => f.flag.source === 'body');
    const ghosts = within(words).getAllByRole('button', { name: /^Red flag \d+ / });
    expect(ghosts).toHaveLength(bodyFlags.length);

    await user.click(ghosts[0]);
    const whisper = document.getElementById(ghosts[0].getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(whisper.hidden).toBe(false);
    expect(whisper.textContent).toContain(bodyFlags[0].flag.reason);
    const link = within(whisper).getByRole('link');
    const target = (link.getAttribute('href') ?? '').slice(1);
    expect(target).toBe(`seance-flag-${bodyFlags[0].number}`);
    expect(document.getElementById(target)?.textContent).toContain(bodyFlags[0].flag.label);
  });

  it.each(['mortal', 'haunted'] as const)('has no axe violations on a round, feedback and the end screen in %s view', async (view) => {
    const rounds = roundsFor();
    const user = userEvent.setup();
    const { container } = renderSeance(view);
    expect(await violations(container)).toEqual([]);
    await user.keyboard(opposite(rounds[0]) === 'scam' ? 's' : 'r');
    expect(await violations(container)).toEqual([]);
    await user.keyboard('{Enter}');
    for (let i = 1; i < 10; i += 1) {
      await user.keyboard(opposite(rounds[i]) === 'scam' ? 's' : 'r');
      if (isScamSample(rounds[i]) && i < 4) expect(await violations(container)).toEqual([]);
      await user.keyboard('{Enter}');
    }
    expect(screen.getByRole('region', { name: 'Your s\u00e9ance is complete' })).toBeTruthy();
    expect(await violations(container)).toEqual([]);
  });
});

describe('S\u00e9ance: in the app', () => {
  it('opens from the navigation and keeps both screens as they were', async () => {
    const user = userEvent.setup();
    render(<App />);
    const checkTab = screen.getByRole('button', { name: 'Possession Check' });
    const seanceTab = screen.getByRole('button', { name: 'S\u00e9ance' });
    expect(screen.getByRole('navigation', { name: 'Screens' })).toBeTruthy();
    expect(checkTab.getAttribute('aria-current')).toBe('page');
    expect(seanceTab.getAttribute('aria-current')).toBeNull();

    const box = screen.getByLabelText('Paste the message you received') as HTMLTextAreaElement;
    await user.click(box);
    await user.paste('Your KYC has expired');
    await user.keyboard('{Escape}');
    (document.activeElement as HTMLElement).blur();
    await user.keyboard('s');

    await user.click(seanceTab);
    expect(seanceTab.getAttribute('aria-current')).toBe('page');
    // The Séance is loaded the first time it is opened, then focus moves to its heading.
    const seanceHeading = await screen.findByRole('heading', { level: 2, name: 'S\u00e9ance' });
    await waitFor(() => expect(document.activeElement).toBe(seanceHeading));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(feedbackRegion()).toBeNull();
    await user.keyboard('s');
    expect(feedbackRegion()).not.toBeNull();

    await user.click(checkTab);
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Possession Check' }));
    expect((screen.getByLabelText('Paste the message you received') as HTMLTextAreaElement).value).toBe('Your KYC has expired');

    await user.click(seanceTab);
    expect(feedbackRegion()).not.toBeNull();
    expect(Object.keys(window.localStorage).every((k) => k === 'phantom-inbox:view' || k === 'phantom-inbox:reduced-motion')).toBe(true);
  });
});
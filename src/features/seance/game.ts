import type { SampleMessage, ScamTopic } from '../../data/samples';

export type Guess = 'real' | 'scam';
export type Phase = 'asking' | 'feedback' | 'finished';

export interface GameState {
  rounds: readonly SampleMessage[];
  /** One guess per answered round, in order. */
  answers: readonly Guess[];
  phase: Phase;
}

export const ROUNDS = 10;
export const MIN_SCAMS = 5;
export const MAX_SCAMS = 7;

/** A practice message is a scam unless the engine is expected to call it safe. */
export function isScamSample(sample: Pick<SampleMessage, 'expectedVerdict'>): boolean {
  return sample.expectedVerdict !== 'looks safe';
}

export function isCorrect(sample: Pick<SampleMessage, 'expectedVerdict'>, guess: Guess): boolean {
  return (guess === 'scam') === isScamSample(sample);
}

/** A whole number from 0 to n - 1, taken from a random number in [0, 1). */
function pick(random: () => number, n: number): number {
  const r = random();
  const safe = Number.isFinite(r) ? Math.min(Math.max(r, 0), 1 - Number.EPSILON) : 0;
  return Math.floor(safe * n);
}

/** Fisher-Yates shuffle into a new array. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = pick(random, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Starts a game: 10 different practice messages, between 5 and 7 of them scams, in a shuffled
 * order. `random` is injectable so tests can replay a game; the app uses Math.random.
 */
export function newGame(pool: readonly SampleMessage[], random: () => number = Math.random, size = ROUNDS): GameState {
  const scams = pool.filter(isScamSample);
  const genuine = pool.filter((s) => !isScamSample(s));
  const scamCount = MIN_SCAMS + pick(random, MAX_SCAMS - MIN_SCAMS + 1);
  const genuineCount = size - scamCount;
  if (scams.length < MAX_SCAMS || genuine.length < size - MIN_SCAMS) {
    throw new Error('The sample pool is too small for a S\u00e9ance game.');
  }
  const chosen = [...shuffle(scams, random).slice(0, scamCount), ...shuffle(genuine, random).slice(0, genuineCount)];
  return { rounds: shuffle(chosen, random), answers: [], phase: 'asking' };
}

/** Index of the round being asked, or of the round whose feedback is showing. */
export function currentIndex(state: GameState): number {
  return state.phase === 'asking' ? state.answers.length : Math.max(0, state.answers.length - 1);
}

/** Records a guess. Ignored unless the game is waiting for an answer. */
export function answer(state: GameState, guess: Guess): GameState {
  if (state.phase !== 'asking' || state.answers.length >= state.rounds.length) return state;
  return { ...state, answers: [...state.answers, guess], phase: 'feedback' };
}

/** Moves on from feedback. Ignored unless feedback is showing. */
export function next(state: GameState): GameState {
  if (state.phase !== 'feedback') return state;
  return { ...state, phase: state.answers.length >= state.rounds.length ? 'finished' : 'asking' };
}

export function scoreOf(state: GameState): number {
  return state.answers.filter((guess, i) => isCorrect(state.rounds[i], guess)).length;
}

/** Scam topics the player answered "real", once each, in the order they came up. */
export function missedTopics(state: GameState): ScamTopic[] {
  const out: ScamTopic[] = [];
  state.answers.forEach((guess, i) => {
    const sample = state.rounds[i];
    if (guess === 'real' && isScamSample(sample) && !out.includes(sample.topic as ScamTopic)) {
      out.push(sample.topic as ScamTopic);
    }
  });
  return out;
}

/** How many real messages the player marked as scams. */
export function falseAlarms(state: GameState): number {
  return state.answers.filter((guess, i) => guess === 'scam' && !isScamSample(state.rounds[i])).length;
}
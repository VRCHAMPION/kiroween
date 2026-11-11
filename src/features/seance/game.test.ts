import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SAMPLES } from '../../data/samples';
import { answer, currentIndex, falseAlarms, isCorrect, isScamSample, MAX_SCAMS, MIN_SCAMS, missedTopics, newGame, next, ROUNDS, scoreOf, type GameState, type Guess } from './game';
import { seeded } from './test-random';

const ids = new Set(SAMPLES.map((s) => s.id));
const play = (state: GameState, guesses: readonly Guess[]) => guesses.reduce((s, g) => next(answer(s, g)), state);
const rightGuess = (state: GameState, i: number): Guess => (isScamSample(state.rounds[i]) ? 'scam' : 'real');

/** Random functions: seeded generators, plus fixed lists that include the extremes 0 and just below 1. */
const randomFn = fc.oneof(
  fc.integer().map((seed) => seeded(seed)),
  fc.array(fc.double({ min: 0, max: 0.999999, noNaN: true }), { minLength: 1, maxLength: 20 }).map((values) => {
    let i = 0;
    return () => values[i++ % values.length];
  }),
  fc.constantFrom(() => 0, () => 0.999999),
);

describe('game examples', () => {
  it('starts asking round 1 with no answers', () => {
    const game = newGame(SAMPLES, seeded(1));
    expect(game.phase).toBe('asking');
    expect(game.answers).toEqual([]);
    expect(currentIndex(game)).toBe(0);
  });

  it('ignores a second answer before moving on, and ignores next while asking', () => {
    const game = newGame(SAMPLES, seeded(2));
    expect(next(game)).toBe(game);
    const answered = answer(game, 'scam');
    expect(answer(answered, 'real')).toBe(answered);
    expect(currentIndex(answered)).toBe(0);
    expect(currentIndex(next(answered))).toBe(1);
  });

  it('gives different games for different seeds', () => {
    const a = newGame(SAMPLES, seeded(3)).rounds.map((r) => r.id).join();
    const b = newGame(SAMPLES, seeded(4)).rounds.map((r) => r.id).join();
    expect(a).not.toBe(b);
  });

  it('scores a perfect game as 10 with nothing missed', () => {
    let game = newGame(SAMPLES, seeded(5));
    for (let i = 0; i < ROUNDS; i += 1) game = next(answer(game, rightGuess(game, i)));
    expect(game.phase).toBe('finished');
    expect(scoreOf(game)).toBe(10);
    expect(missedTopics(game)).toEqual([]);
    expect(falseAlarms(game)).toBe(0);
  });

  it('counts false alarms and names each missed scam topic once', () => {
    const game = newGame(SAMPLES, seeded(6));
    const done = play(game, game.rounds.map((r) => (isScamSample(r) ? 'real' : 'scam')));
    expect(scoreOf(done)).toBe(0);
    expect(falseAlarms(done)).toBe(game.rounds.filter((r) => !isScamSample(r)).length);
    expect(missedTopics(done)).toEqual([...new Set(game.rounds.filter(isScamSample).map((r) => r.topic))]);
  });
});

describe('game properties', () => {
  // Feature: seance, Property 1: A game always has 10 unique rounds with a fair mix
  // Whatever the random numbers, a game has 10 different pool samples and 5 to 7 of them are scams.
  it('always has 10 unique rounds from the pool with 5 to 7 scams', () => {
    fc.assert(
      fc.property(randomFn, (random) => {
        const { rounds } = newGame(SAMPLES, random);
        expect(rounds).toHaveLength(ROUNDS);
        expect(new Set(rounds.map((r) => r.id)).size).toBe(ROUNDS);
        for (const r of rounds) expect(ids.has(r.id)).toBe(true);
        const scams = rounds.filter(isScamSample).length;
        expect(scams).toBeGreaterThanOrEqual(MIN_SCAMS);
        expect(scams).toBeLessThanOrEqual(MAX_SCAMS);
      }),
      { numRuns: 300 },
    );
  });

  // Feature: seance, Property 2: The score is always 0 to 10 and counts right answers
  // Any mix of answers, extra presses and next steps keeps the score from 0 to 10, equal to the right answers.
  it('keeps the score from 0 to 10 for any sequence of actions', () => {
    const action = fc.constantFrom<'real' | 'scam' | 'next'>('real', 'scam', 'next');
    fc.assert(
      fc.property(fc.integer(), fc.array(action, { maxLength: 40 }), (seed, actions) => {
        let game = newGame(SAMPLES, seeded(seed));
        for (const a of actions) {
          game = a === 'next' ? next(game) : answer(game, a);
          const score = scoreOf(game);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(ROUNDS);
          expect(game.answers.length).toBeLessThanOrEqual(ROUNDS);
          expect(score).toBe(game.answers.filter((g, i) => isCorrect(game.rounds[i], g)).length);
        }
      }),
      { numRuns: 300 },
    );
  });

  // Feature: seance, Property 2: The score is always 0 to 10 and counts right answers
  // Ten answers, each followed by next, always finish the game with the score of the matching guesses.
  it('finishes after exactly 10 answers', () => {
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.constantFrom<Guess>('real', 'scam'), { minLength: ROUNDS, maxLength: ROUNDS }), (seed, guesses) => {
        const start = newGame(SAMPLES, seeded(seed));
        let game = start;
        guesses.forEach((g, i) => {
          expect(game.phase).toBe('asking');
          game = next(answer(game, g));
          expect(game.phase).toBe(i === ROUNDS - 1 ? 'finished' : 'asking');
        });
        expect(scoreOf(game)).toBe(guesses.filter((g, i) => isCorrect(start.rounds[i], g)).length);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: seance, Property 6: Missed topics are exactly the scams answered "real"
  // The end screen's missed list holds each missed scam topic once, and is empty only when no scam was missed.
  it('lists exactly the topics of missed scams, once each', () => {
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.constantFrom<Guess>('real', 'scam'), { minLength: ROUNDS, maxLength: ROUNDS }), (seed, guesses) => {
        const game = play(newGame(SAMPLES, seeded(seed)), guesses);
        const missed = game.rounds.filter((r, i) => isScamSample(r) && guesses[i] === 'real');
        const topics = missedTopics(game);
        expect(new Set(topics).size).toBe(topics.length);
        expect(new Set(topics)).toEqual(new Set(missed.map((r) => r.topic)));
        expect(topics.length === 0).toBe(missed.length === 0);
      }),
      { numRuns: 300 },
    );
  });
});
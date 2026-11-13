import { describe, it, expect } from 'vitest'
import { scoreGuess } from './score'
import type { LetterState } from './types'

/**
 * Tests for the per-letter feedback scorer.
 *
 * Written BEFORE the implementation, per CLAUDE.md's Fifth Directive, which
 * names this specific function: it is the one algorithm in a Wordle that is
 * genuinely easy to get wrong, and a scoring regression is invisible in
 * casual play while corrupting every game.
 *
 * Fourth Directive check — why each of these is a real test and not coverage
 * theatre: every case below is a board state a player reaches by typing a
 * normal English word. None of them mocks anything, and each one would catch
 * a distinct wrong implementation.
 */

// Shorthand so expectations read like a board rather than like prose.
const X = 'exact' satisfies LetterState
const P = 'present' satisfies LetterState
const _ = 'absent' satisfies LetterState

describe('scoreGuess', () => {
  it('marks a correct guess all exact', () => {
    expect(scoreGuess('STACK', 'STACK')).toEqual([X, X, X, X, X])
  })

  it('marks a guess sharing no letters all absent', () => {
    // QUERY vs no shared letter: the first board a player sees when their
    // opening probe misses entirely.
    expect(scoreGuess('QUERY', 'BLIMP')).toEqual([_, _, _, _, _])
  })

  it('distinguishes right-letter-right-place from right-letter-wrong-place', () => {
    // answer CACHE, guess CHASE:
    //   C exact. H present (answer has H, at index 3). A present (index 1).
    //   S absent. E exact (index 4).
    expect(scoreGuess('CHASE', 'CACHE')).toEqual([X, P, P, _, X])
  })
})

describe('duplicate letters', () => {
  /**
   * The headline case. A naive scorer claims exact positions, then marks
   * every remaining guess letter "present" if it appears ANYWHERE in the
   * answer — which hands out more hints for a letter than the answer
   * actually contains.
   *
   *   answer   S E E D S
   *   guess    G E E S E
   *
   * The answer holds exactly two E's, and BOTH are consumed by the exact
   * matches at index 1 and 2. The guess's third E (index 4) therefore has
   * nothing left to claim and must read absent. A naive scorer reports it
   * as present, telling the player there is another E to find.
   *
   * This exact pair is the contract written into ADR-0001's COD block. Worth
   * recording: that block's first version got the count right and the
   * POSITIONS wrong, and writing this test is what caught it (ADR-0001
   * Iteration 2). The test checks the record, not only the code.
   */
  it('does not over-report a repeated guess letter (GEESE against SEEDS)', () => {
    expect(scoreGuess('GEESE', 'SEEDS')).toEqual([_, X, X, P, _])
  })

  it('spends the answer\'s letter budget left to right on non-exact matches', () => {
    // answer ARRAY, guess RADAR:
    //   index 0  R  -> not exact (answer has A). Answer's unclaimed letters
    //                  are A,R,R,A,Y minus the exact at index 3 (A) = A,R,R,Y.
    //                  R available -> present, budget R:1 left.
    //   index 1  A  -> present (A available), budget A:0 left.
    //   index 2  D  -> absent.
    //   index 3  A  -> exact.
    //   index 4  R  -> R still available -> present.
    expect(scoreGuess('RADAR', 'ARRAY')).toEqual([P, P, _, X, P])
  })

  it('gives only one hint when the guess doubles a letter the answer holds once', () => {
    // answer STACK holds one A. Guess ALPHA has two.
    //   index 0  A -> present (the single A), budget spent.
    //   index 4  A -> absent, because the budget is gone.
    // A scorer that forgets to decrement reports both as present.
    expect(scoreGuess('ALPHA', 'STACK')).toEqual([P, _, _, _, _])
  })

  it('prefers an exact match over an earlier present one for the same letter', () => {
    // answer QUEUE, guess EERIE. The answer has two E's (index 2, 4).
    //   index 4 is exact, so one E is consumed there. Pass one runs first
    //   and claims it, which is the whole reason exacts must be scored
    //   BEFORE presents are handed out.
    //   index 0  E -> present (the other E, at index 2).
    //   index 1  E -> absent (budget gone).
    //   index 2  R -> absent.
    //   index 3  I -> absent.
    //   index 4  E -> exact.
    expect(scoreGuess('EERIE', 'QUEUE')).toEqual([P, _, _, _, X])
  })
})

describe('input handling', () => {
  it('is case-insensitive in both directions', () => {
    // The keyboard component emits uppercase, but a restored localStorage
    // board or a hand-typed test should not be able to produce a silently
    // all-absent row. Normalising here is cheaper than trusting every caller.
    expect(scoreGuess('stack', 'STACK')).toEqual([X, X, X, X, X])
    expect(scoreGuess('STACK', 'stack')).toEqual([X, X, X, X, X])
  })

  it('throws when the guess and answer differ in length', () => {
    // A length mismatch means the caller has a bug — most plausibly a board
    // restored from localStorage against a different puzzle, which is the
    // exact failure ADR-0002 names as the one endless play introduces
    // (no date to invalidate a stale board). Failing loudly here turns a
    // silently wrong board into a visible error.
    expect(() => scoreGuess('CACHE', 'ARRAYS')).toThrow(/length/i)
  })
})

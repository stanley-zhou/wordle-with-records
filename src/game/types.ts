/**
 * Core game types.
 *
 * ADR-0003 (QST-TYPESCRIPT = A) argued for TypeScript from one concrete case,
 * and this file is it: `LetterState` is the three-state union the scorer
 * returns, and the compiler is what stops a fourth state leaking in from a
 * careless branch.
 */

/**
 * The result of scoring one letter of a guess.
 *
 * ⚠️ STANDING CONSTRAINT (ADR-0001 Consequences, ADR-0003 Open Follow-ups):
 * these are SEMANTIC states, never colours. Colour currently carries the
 * game's entire feedback channel, and red-green colour blindness affects
 * roughly 8% of men — so a theme maps states to colours, and the scorer is
 * forbidden to know about colours at all. This type is the enforcement:
 * `'green'` will not compile.
 */
export type LetterState = 'exact' | 'present' | 'absent'

/**
 * One puzzle: the answer, plus the gloss that makes a loss into something
 * learned (ADR-0001's deferred post-game-definition follow-up gets this for
 * free, because the ratification process produces glosses anyway).
 *
 * `length` is carried on the record rather than hardcoded as 5 across the
 * board, keyboard, and scorer — the implementation hedge stated in ADR-0001's
 * five-letter assumption, so a mixed-length mode later is a data change
 * rather than a rewrite.
 */
export interface Puzzle {
  readonly id: string
  readonly word: string
  readonly length: number
  readonly gloss: string
}

/** A submitted guess and the feedback it earned. */
export interface ScoredGuess {
  readonly word: string
  readonly states: readonly LetterState[]
}

export type GamePhase = 'playing' | 'won' | 'lost'

export const MAX_GUESSES = 6

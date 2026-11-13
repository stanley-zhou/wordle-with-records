import corpus from '../data/answers.json'

/**
 * Guess validation — shipped as an INTERFACE on purpose.
 *
 * ADR-0001 (QST-GUESS-LEGALITY = B) chose Wordle's own split: answers come
 * from the curated CS corpus, guesses are validated against a standard
 * English five-letter dictionary with the CS corpus unioned in. The reason is
 * that probes (ADIEU, CRANE) are what make the game deduction rather than
 * recall, and a themed answer list makes them MORE necessary, not less.
 *
 * But Stanley attached a condition: the dictionary needs a recorded source
 * and licence, held to the same standard as the answer corpus. And
 * QST-CORPUS-SCALE-60 ruled that this must not block a playable build. So:
 *
 *   v1 (now)   — `CorpusOnlyValidator`. Legal guesses are the CS corpus.
 *   v2 (next)  — `DictionaryValidator`, lazily loading the English list once
 *                its provenance is written into ADR-0001.
 *
 * ⚠️ The seam is what keeps that honest. v1 looks exactly like
 * QST-GUESS-LEGALITY option A (CS-only) from the player's side, and that
 * resemblance is the trap: if nobody ever swaps the implementation, the
 * project has silently shipped the option it rejected, having recorded a
 * decision for B. `isInterim` exists so the UI can SAY SO out loud rather
 * than letting the interim state pass for the decision.
 */

export type Legality =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string }

export interface GuessValidator {
  /** Is this word a legal guess? */
  check(word: string): Legality
  /** Human-readable description of what is currently accepted. */
  describe(): string
  /** True while this is the stand-in rather than the decided behaviour. */
  readonly isInterim: boolean
}

const corpusWords: ReadonlySet<string> = new Set(
  corpus.words.map((entry) => entry.word.toUpperCase()),
)

/**
 * v1: the CS corpus is the guess list.
 *
 * Honest about the cost in its own rejection message, because with ~60 legal
 * words the player will meet it often — and the message is the one place a
 * player can learn that the restriction is temporary.
 */
export const corpusOnlyValidator: GuessValidator = {
  isInterim: true,

  check(word: string): Legality {
    const candidate = word.toUpperCase()
    if (corpusWords.has(candidate)) return { ok: true }
    return {
      ok: false,
      reason: `${candidate} isn't in the word list yet`,
    }
  },

  describe(): string {
    return `${corpusWords.size} computer-science words`
  },
}

/**
 * The validator the app uses. One assignment, so swapping in the dictionary
 * implementation touches this line and nothing else.
 */
export const validator: GuessValidator = corpusOnlyValidator

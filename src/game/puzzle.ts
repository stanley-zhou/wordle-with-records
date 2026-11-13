import corpus from '../data/answers.json'
import type { Puzzle } from './types'

/**
 * Puzzle selection — the single module that owns the cadence decision.
 *
 * ADR-0002 (QST-CADENCE = C) chose ENDLESS PRACTICE for v1: a fresh puzzle
 * whenever the player asks, no calendar, no rollover semantics, no epoch.
 * The reason was build order, not preference — a daily ritual needs a shared
 * audience comparing results, and you cannot playtest a scorer at one puzzle
 * per day.
 *
 * Choosing C was only safe because reopening it is cheap, and THIS MODULE IS
 * WHAT MAKES IT CHEAP. Nothing outside here may import a cadence assumption.
 * If ADR-0002 is reopened as option B (UTC daily — the recorded trigger is
 * "if I share it with the class"), the change is `dailyPuzzle()` below plus
 * one call site, and the rest of the app does not learn about it.
 */

interface CorpusEntry {
  readonly word: string
  readonly gloss: string
  readonly conf: string
}

const entries: readonly CorpusEntry[] = corpus.words

/** Is the shipped corpus still awaiting Stanley's strike-a-row review? */
export const corpusIsRatified = corpus._status === 'ratified'

export const corpusSize = entries.length

function toPuzzle(entry: CorpusEntry): Puzzle {
  return {
    // The word IS the identity. ADR-0002's Consequences require a saved board
    // to carry its puzzle's identity, because endless play has no date to
    // invalidate a stale board against.
    //
    // Deliberately not an index. An index is unstable under corpus edits —
    // striking one row during ratification shifts every later index, so a
    // saved board would silently rebind to a DIFFERENT answer, which is
    // exactly the failure the id exists to prevent. Rows will be struck this
    // week, so that is a near-certainty rather than a hypothetical.
    //
    // This relies on words being unique, which `puzzle.test.ts` asserts
    // against the real data file rather than trusting the curators.
    id: entry.word.toUpperCase(),
    word: entry.word.toUpperCase(),
    length: entry.word.length,
    gloss: entry.gloss,
  }
}

/**
 * A random puzzle, avoiding an immediate repeat of `afterId`.
 *
 * Not avoiding *all* previously-seen words: with ~60 answers a session will
 * repeat, and ADR-0001 records that fact as the corpus-growth trigger rather
 * than something to paper over here. Tracking a full seen-set would hide the
 * signal that says the corpus needs to grow.
 */
export function randomPuzzle(afterId?: string): Puzzle {
  if (entries.length === 0) {
    throw new Error('puzzle: the answer corpus is empty')
  }
  if (entries.length === 1) {
    return toPuzzle(entries[0]!)
  }
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const index = Math.floor(Math.random() * entries.length)
    const candidate = toPuzzle(entries[index]!)
    if (candidate.id !== afterId) return candidate
  }
  // Pathological RNG; correctness does not depend on the retry loop.
  const index = Math.floor(Math.random() * entries.length)
  return toPuzzle(entries[index]!)
}

/**
 * NOT WIRED UP — deliberately. This is ADR-0002 option B, kept here as the
 * thing that drops in behind `randomPuzzle`'s interface if cadence reopens,
 * and as proof that the deferral really was ten lines rather than an
 * architecture.
 *
 * Two notes that belong next to the code rather than only in the record:
 *   - EPOCH freezes at the first daily deploy. Moving it renumbers every past
 *     puzzle and desynchronises anyone mid-game.
 *   - `% size` makes the corpus a RING, so adding words shifts the whole
 *     future schedule. If repeats ever matter, the fix is a committed
 *     shuffled order, not a longer list.
 */
export function dailyPuzzle(now: Date = new Date()): Puzzle {
  const EPOCH = Date.UTC(2026, 0, 1)
  const DAY = 86_400_000
  const days = Math.floor((now.getTime() - EPOCH) / DAY)
  const size = entries.length
  const index = ((days % size) + size) % size
  return toPuzzle(entries[index]!)
}

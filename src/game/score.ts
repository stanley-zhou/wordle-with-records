import type { LetterState } from './types'

/**
 * Score one guess against one answer, returning a state per letter position.
 *
 * This is the only genuinely tricky algorithm in the game, and CLAUDE.md's
 * Fifth Directive names it specifically. Its tests were written first; see
 * `score.test.ts` and ADR-0001's COD block for the contract.
 *
 * TWO PASSES, and the order is the whole algorithm:
 *
 *   Pass 1 claims every exact position AND tallies only the answer letters
 *          that the exacts did NOT consume.
 *   Pass 2 walks the non-exact positions left to right, spending from that
 *          tally — so a letter can only be reported as "present" as many
 *          times as the answer actually has it left over.
 *
 * A one-pass scorer (claim exacts, then mark anything that appears
 * *anywhere*) passes every casual playthrough and silently lies about
 * repeated letters: GEESE against SEEDS reports three E hints when the
 * answer holds two. That bug is invisible in play and corrupts every game,
 * which is why it is pinned by a named test rather than trusted to review.
 *
 * Returns semantic states, never colours — ADR-0001's standing constraint,
 * so that a high-contrast or colour-blind theme stays possible. `LetterState`
 * is the enforcement.
 */
export function scoreGuess(guess: string, answer: string): LetterState[] {
  const g = guess.toUpperCase()
  const a = answer.toUpperCase()

  if (g.length !== a.length) {
    // The caller has a bug. Most plausible cause: a board restored from
    // localStorage against a different puzzle — the one failure ADR-0002
    // names as introduced by endless play, which has no date to invalidate a
    // stale board. Loud beats a silently all-absent row.
    throw new Error(
      `scoreGuess: length mismatch — guess "${g}" (${g.length}) ` +
        `vs answer "${a}" (${a.length})`,
    )
  }

  const states: LetterState[] = Array.from({ length: g.length }, () => 'absent')

  // Pass 1 — exact positions, and a tally of what they leave behind.
  const unclaimed = new Map<string, number>()
  for (let i = 0; i < g.length; i += 1) {
    const guessChar = g[i]!
    const answerChar = a[i]!
    if (guessChar === answerChar) {
      states[i] = 'exact'
    } else {
      unclaimed.set(answerChar, (unclaimed.get(answerChar) ?? 0) + 1)
    }
  }

  // Pass 2 — distribute what is left, left to right.
  for (let i = 0; i < g.length; i += 1) {
    if (states[i] === 'exact') continue
    const guessChar = g[i]!
    const available = unclaimed.get(guessChar) ?? 0
    if (available > 0) {
      states[i] = 'present'
      unclaimed.set(guessChar, available - 1)
    }
  }

  return states
}

/** True when every position is an exact match. */
export function isSolved(states: readonly LetterState[]): boolean {
  return states.length > 0 && states.every((s) => s === 'exact')
}

/**
 * Best-known state per letter, for colouring the on-screen keyboard.
 *
 * "Best" is ordered exact > present > absent, so a letter never downgrades:
 * once a player has learned that E is in position 2, a later guess putting E
 * somewhere wrong must not repaint the key as merely present. Getting this
 * backwards is the second-most-common Wordle implementation bug after the
 * duplicate-letter one, and it actively misleads the player.
 */
const RANK: Record<LetterState, number> = { absent: 0, present: 1, exact: 2 }

export function keyboardStates(
  guesses: readonly { word: string; states: readonly LetterState[] }[],
): Map<string, LetterState> {
  const best = new Map<string, LetterState>()
  for (const guess of guesses) {
    const word = guess.word.toUpperCase()
    for (let i = 0; i < word.length; i += 1) {
      const char = word[i]!
      const state = guess.states[i]
      if (!state) continue
      const current = best.get(char)
      if (current === undefined || RANK[state] > RANK[current]) {
        best.set(char, state)
      }
    }
  }
  return best
}

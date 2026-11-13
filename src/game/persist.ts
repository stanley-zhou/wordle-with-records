import type { GamePhase, LetterState } from './types'

/**
 * Board persistence — localStorage and nothing else.
 *
 * ADR-0002's stated assumption: no accounts, no sync, no backend. Progress is
 * per-browser, clearing site data wipes it, and a player's phone and laptop
 * are strangers. That is the accepted price of free static hosting.
 *
 * ⚠️ THE TRAP THIS MODULE EXISTS TO AVOID (ADR-0002, Open Follow-ups):
 * a reload mid-puzzle should restore the player's guesses. Under a DAILY
 * cadence the date invalidates a stale board for free. Under endless play
 * there is no such key — so a restored board can be replayed against a
 * DIFFERENT answer, producing a wrong-but-plausible game state, which is the
 * worst kind of bug because nothing looks broken.
 *
 * The fix: the saved record carries its puzzle's `id`, and `load()` refuses
 * anything that does not match the puzzle being played. ADR-0002 names this
 * as the one concrete bug endless mode introduces that daily mode would have
 * prevented, so it is handled here rather than discovered later.
 */

const KEY = 'wordle-with-records:board:v1'

export interface SavedBoard {
  readonly puzzleId: string
  readonly guesses: readonly { word: string; states: readonly LetterState[] }[]
  readonly phase: GamePhase
}

export function save(board: SavedBoard): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(board))
  } catch {
    // Private browsing, a full quota, or storage disabled entirely. Losing
    // the save is a worse game, not a broken one — never let it break play.
  }
}

/**
 * Load the saved board, but only if it belongs to `expectedPuzzleId`.
 *
 * Returns null for a mismatch, which is the guard described above.
 */
export function load(expectedPuzzleId: string): SavedBoard | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const board = parsed as Partial<SavedBoard>
    if (typeof board.puzzleId !== 'string' || !Array.isArray(board.guesses)) {
      return null
    }

    // The guard. A board saved against a different puzzle is discarded, not
    // replayed — see this module's header.
    if (board.puzzleId !== expectedPuzzleId) return null

    return {
      puzzleId: board.puzzleId,
      guesses: board.guesses,
      phase: board.phase ?? 'playing',
    }
  } catch {
    // Corrupt or hand-edited storage. Starting fresh beats crashing.
    return null
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // See save().
  }
}

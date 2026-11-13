import { describe, it, expect } from 'vitest'
import corpus from '../data/answers.json'
import { randomPuzzle, corpusSize } from './puzzle'

/**
 * Integrity tests for the hand-curated answer corpus.
 *
 * Fourth Directive check — why these are real tests and not coverage
 * theatre: `src/data/answers.json` is edited BY HAND by two people (ADR-0001
 * chose a committed, human-ratified corpus over a generated one, deliberately),
 * and it is about to be edited heavily — Stanley's strike-a-row review is
 * pending, and the list grows toward ~300 by the same process. Every
 * assertion below guards a mistake a human actually makes while editing a
 * JSON list of words by hand, and each failure would be invisible in play.
 */
describe('answer corpus integrity', () => {
  const words = corpus.words.map((entry) => entry.word)

  it('has no duplicate words', () => {
    // A duplicate is the likeliest hand-edit error in a list this size, and
    // it does two silent things: it doubles that word's selection odds, and
    // it breaks the uniqueness that puzzle ids rely on to detect a stale
    // saved board (ADR-0002).
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const word of words) {
      if (seen.has(word)) duplicates.push(word)
      seen.add(word)
    }
    expect(duplicates).toEqual([])
  })

  it('contains only five uppercase A-Z letters per word', () => {
    // ADR-0001's stated assumption. A lowercase entry or a stray space would
    // still render, but would score wrongly or never match a typed guess —
    // the scorer uppercases, the validator's Set does not forgive a space.
    const malformed = words.filter((word) => !/^[A-Z]{5}$/.test(word))
    expect(malformed).toEqual([])
  })

  it('gives every word a non-empty gloss', () => {
    // The gloss is shown on the reveal screen, so an empty one is a visible
    // hole in the UI — and ADR-0001 notes the glosses are what make the
    // "definition after the final guess" follow-up nearly free.
    const missing = corpus.words.filter((entry) => !entry.gloss?.trim())
    expect(missing).toEqual([])
  })

  it('is big enough to be worth playing', () => {
    // ADR-0001's v1 target is ~60 with a ~50-word floor after striking every
    // medium-confidence row. Fails loudly if a review over-prunes.
    expect(corpusSize).toBeGreaterThanOrEqual(50)
  })
})

describe('randomPuzzle', () => {
  it('identifies a puzzle by its word, not by a corpus position', () => {
    // Ids must survive corpus edits. An index-based id would silently rebind
    // a saved board to a different answer the first time a row is struck
    // during ratification — which is happening this week (ADR-0002).
    const puzzle = randomPuzzle()
    expect(puzzle.id).toBe(puzzle.word)
    expect(puzzle.length).toBe(puzzle.word.length)
  })

  it('does not immediately repeat the puzzle just played', () => {
    // The "Next word" button's one real requirement: being handed the same
    // word you just solved reads as broken. Repeated because the selection
    // is random — a single pass could pass by luck.
    const first = randomPuzzle()
    for (let i = 0; i < 50; i += 1) {
      expect(randomPuzzle(first.id).id).not.toBe(first.id)
    }
  })
})

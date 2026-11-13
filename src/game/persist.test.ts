import { describe, it, expect, beforeEach } from 'vitest'
import * as persist from './persist'
import type { SavedBoard } from './persist'

/**
 * Tests for the saved-board guard.
 *
 * Fourth Directive check — this is the one concrete bug ADR-0002 says the
 * endless-play decision introduces, named in the record before any code
 * existed: under a daily cadence the date invalidates a stale board for free,
 * but endless play has no such key, so a restored board can be replayed
 * against a *different* answer. The player sees a plausible board with wrong
 * colours and no error. That is worth a test; "does localStorage store
 * things" would not be.
 *
 * The localStorage stub below is the storage backend, not the subject — the
 * logic under test is `load()`'s puzzle-id check.
 */

function installStorageStub(): void {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    },
  })
}

const board: SavedBoard = {
  puzzleId: 'STACK',
  guesses: [{ word: 'QUEUE', states: ['absent', 'absent', 'absent', 'absent', 'absent'] }],
  phase: 'playing',
}

describe('saved board', () => {
  beforeEach(() => {
    installStorageStub()
  })

  it('restores a board saved against the same puzzle', () => {
    // The feature: reloading mid-puzzle keeps your guesses.
    persist.save(board)
    expect(persist.load('STACK')).toEqual(board)
  })

  it('refuses a board saved against a different puzzle', () => {
    // The guard. Without it, QUEUE's row would be rendered against CACHE's
    // answer — ADR-0002's named failure.
    persist.save(board)
    expect(persist.load('CACHE')).toBeNull()
  })

  it('returns null rather than throwing on corrupt storage', () => {
    // Hand-edited or truncated storage is a real thing on a static site
    // people keep open for weeks. Starting a fresh board beats a white screen.
    localStorage.setItem('wordle-with-records:board:v1', '{not json')
    expect(persist.load('STACK')).toBeNull()
  })

  it('clears a board so the next puzzle starts empty', () => {
    // Backs the "Next word" button: a leftover board must not survive into
    // the next puzzle even before the id guard gets a chance to reject it.
    persist.save(board)
    persist.clear()
    expect(persist.load('STACK')).toBeNull()
  })

  it('survives storage being unavailable entirely', () => {
    // Private browsing and quota-exceeded both throw from setItem. Losing the
    // save is a worse game; an uncaught exception is a broken one.
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('denied')
        },
        setItem: () => {
          throw new Error('denied')
        },
        removeItem: () => {
          throw new Error('denied')
        },
      },
    })
    expect(() => persist.save(board)).not.toThrow()
    expect(persist.load('STACK')).toBeNull()
    expect(() => persist.clear()).not.toThrow()
  })
})

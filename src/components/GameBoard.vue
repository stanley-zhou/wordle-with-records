<script setup lang="ts">
import { computed } from 'vue'
import WordTile from './WordTile.vue'
import type { LetterState, ScoredGuess } from '@/game/types'

const props = defineProps<{
  guesses: readonly ScoredGuess[]
  draft: string
  wordLength: number
  maxGuesses: number
  shake: boolean
}>()

interface Cell {
  letter: string
  state?: LetterState
  active: boolean
}

/**
 * The board as a plain grid of cells: submitted rows, then the row being
 * typed, then empties. Computed in one place so the template stays a
 * description of layout rather than a pile of index arithmetic.
 */
const rows = computed<Cell[][]>(() => {
  const out: Cell[][] = []

  for (const guess of props.guesses) {
    out.push(
      Array.from({ length: props.wordLength }, (_unused, i) => ({
        letter: guess.word[i] ?? '',
        state: guess.states[i],
        active: false,
      })),
    )
  }

  if (out.length < props.maxGuesses) {
    out.push(
      Array.from({ length: props.wordLength }, (_unused, i) => ({
        letter: props.draft[i] ?? '',
        active: true,
      })),
    )
  }

  while (out.length < props.maxGuesses) {
    out.push(
      Array.from({ length: props.wordLength }, () => ({
        letter: '',
        active: false,
      })),
    )
  }

  return out
})

const isCurrentRow = (index: number) => index === props.guesses.length
</script>

<template>
  <div class="board" role="grid" aria-label="Guess board">
    <div
      v-for="(row, rowIndex) in rows"
      :key="rowIndex"
      class="row"
      :class="{ shaking: props.shake && isCurrentRow(rowIndex) }"
      :style="{ '--cols': props.wordLength }"
      role="row"
    >
      <WordTile
        v-for="(cell, cellIndex) in row"
        :key="cellIndex"
        :letter="cell.letter"
        :state="cell.state"
        :active="cell.active && cell.letter !== ''"
      />
    </div>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(330px, 86vw);
  margin-inline: auto;
}

.row {
  /*
    Driven by --cols from the puzzle's own `length`, never a hardcoded 5.
    ADR-0001's five-letter assumption carries this hedge explicitly, so a
    mixed-length mode later is a data change rather than a CSS rewrite.
  */
  display: grid;
  grid-template-columns: repeat(var(--cols, 5), 1fr);
  gap: 6px;
}

.shaking {
  animation: shake 320ms ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

@media (prefers-reduced-motion: reduce) {
  .shaking {
    animation: none;
  }
}
</style>

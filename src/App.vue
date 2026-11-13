<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import GameBoard from './components/GameBoard.vue'
import KeyBoard from './components/KeyBoard.vue'
import { isSolved, keyboardStates, scoreGuess } from './game/score'
import { corpusIsRatified, corpusSize, randomPuzzle } from './game/puzzle'
import { validator } from './game/validate'
import * as persist from './game/persist'
import { MAX_GUESSES, type GamePhase, type Puzzle, type ScoredGuess } from './game/types'

const puzzle = ref<Puzzle>(randomPuzzle())
const guesses = ref<ScoredGuess[]>([])
const draft = ref('')
const phase = ref<GamePhase>('playing')
const message = ref('')
const shake = ref(false)

const keyStates = computed(() => keyboardStates(guesses.value))
const isOver = computed(() => phase.value !== 'playing')

function flash(text: string, withShake = false): void {
  message.value = text
  if (withShake) {
    shake.value = true
    window.setTimeout(() => (shake.value = false), 340)
  }
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 2200)
}

function restore(): void {
  const saved = persist.load(puzzle.value.id)
  // A null here is the common, healthy case: either nothing saved, or a board
  // belonging to a different puzzle, which persist.load() refuses by design
  // (ADR-0002 — endless play has no date to invalidate a stale board).
  if (!saved) return
  guesses.value = saved.guesses.map((g) => ({ word: g.word, states: g.states }))
  phase.value = saved.phase
}

function submit(): void {
  if (isOver.value) return

  if (draft.value.length !== puzzle.value.length) {
    flash(`Needs ${puzzle.value.length} letters`, true)
    return
  }

  const legality = validator.check(draft.value)
  if (!legality.ok) {
    flash(legality.reason, true)
    return
  }

  const states = scoreGuess(draft.value, puzzle.value.word)
  guesses.value = [...guesses.value, { word: draft.value, states }]
  draft.value = ''

  if (isSolved(states)) {
    phase.value = 'won'
    flash('Solved.')
  } else if (guesses.value.length >= MAX_GUESSES) {
    phase.value = 'lost'
  }

  persist.save({
    puzzleId: puzzle.value.id,
    guesses: guesses.value,
    phase: phase.value,
  })
}

function typeLetter(char: string): void {
  if (isOver.value) return
  if (draft.value.length >= puzzle.value.length) return
  draft.value += char.toUpperCase()
}

function backspace(): void {
  if (isOver.value) return
  draft.value = draft.value.slice(0, -1)
}

/** Endless play: ADR-0002's chosen cadence, one button. */
function nextPuzzle(): void {
  persist.clear()
  puzzle.value = randomPuzzle(puzzle.value.id)
  guesses.value = []
  draft.value = ''
  phase.value = 'playing'
  message.value = ''
}

function onKeydown(event: KeyboardEvent): void {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key === 'Enter') {
    if (isOver.value) nextPuzzle()
    else submit()
    return
  }
  if (event.key === 'Backspace') {
    backspace()
    return
  }
  if (/^[a-zA-Z]$/.test(event.key)) typeLetter(event.key)
}

onMounted(() => {
  restore()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

watch(puzzle, () => restore())
</script>

<template>
  <div class="app">
    <header class="masthead">
      <h1>CS Wordle</h1>
      <p class="tagline">Every answer is a computer-science word.</p>
    </header>

    <p class="status" role="status" aria-live="polite">{{ message }}</p>

    <GameBoard
      :guesses="guesses"
      :draft="draft"
      :word-length="puzzle.length"
      :max-guesses="MAX_GUESSES"
      :shake="shake"
    />

    <section v-if="isOver" class="outcome">
      <p class="reveal">
        <strong>{{ puzzle.word }}</strong> — {{ puzzle.gloss }}
      </p>
      <button class="again" type="button" @click="nextPuzzle">Next word</button>
    </section>

    <KeyBoard
      :states="keyStates"
      :disabled="isOver"
      @letter="typeLetter"
      @enter="submit"
      @backspace="backspace"
    />

    <footer class="footer">
      <!--
        The one-line disclosure from ADR-0001's Consequences: naming the pool
        size bounds a search space that would otherwise feel like the whole
        English dictionary. Costs nothing and competes with no colour channel.
      -->
      <p>Six guesses. The answer is one of {{ corpusSize }} computer-science words.</p>

      <!--
        Honesty valve for validate.ts's interim state. Right now guesses are
        restricted to the CS corpus, which LOOKS like the option ADR-0001
        rejected — so while `isInterim` holds, the UI says so rather than
        letting the stand-in pass for the decision.
      -->
      <p v-if="validator.isInterim" class="caveat">
        Guesses are currently limited to those {{ corpusSize }} words. The open
        English word list is coming once its licence is recorded — see ADR-0001.
      </p>
      <p v-if="!corpusIsRatified" class="caveat">
        Draft word list, pending review.
      </p>
    </footer>
  </div>
</template>

<style scoped>
/*
  Theme variables live here, at the app root, and every child component reads
  them. That is what makes the "scorer returns states, never colours"
  constraint pay off: a high-contrast or colour-blind palette is a change to
  the three --state-* values below and nothing else in the codebase.

  Defaults are Wordle's own tile colours, which are also the seat's colour
  lineage: #6AAA64 is the exact green of a correct-position tile.
*/
.app {
  --bg: #ffffff;
  --fg: #1a1a1b;
  --line: #d3d6da;
  --line-strong: #878a8c;

  --state-exact: #6aaa64;
  --state-present: #c9b458;
  --state-absent: #787c7e;
  --on-state: #ffffff;

  --key-bg: #d3d6da;
  --key-bg-hover: #bfc3c7;
  --key-fg: #1a1a1b;

  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  min-height: 100vh;
  padding: 1rem 0.5rem 1.5rem;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

@media (prefers-color-scheme: dark) {
  .app {
    --bg: #121213;
    --fg: #f8f8f8;
    --line: #3a3a3c;
    --line-strong: #565758;
    --state-absent: #3a3a3c;
    --key-bg: #818384;
    --key-bg-hover: #6e7071;
    --key-fg: #f8f8f8;
  }
}

.masthead {
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--line);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tagline {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.status {
  min-height: 1.4em;
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.outcome {
  text-align: center;
}

.reveal {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
}

.reveal strong {
  letter-spacing: 0.1em;
}

.again {
  padding: 0.6rem 1.25rem;
  border: 0;
  border-radius: 4px;
  background: var(--state-exact);
  color: var(--on-state);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.footer {
  margin-top: auto;
  text-align: center;
  font-size: 0.72rem;
  opacity: 0.65;
}

.footer p {
  margin: 0.2rem 0;
}

.caveat {
  font-style: italic;
}
</style>

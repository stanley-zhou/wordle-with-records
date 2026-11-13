<script setup lang="ts">
import type { LetterState } from '@/game/types'

const props = defineProps<{
  /** Best-known state per letter; see score.ts keyboardStates(). */
  states: Map<string, LetterState>
  disabled: boolean
}>()

const emit = defineEmits<{
  letter: [char: string]
  enter: []
  backspace: []
}>()

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'] as const
</script>

<template>
  <div class="keyboard" role="group" aria-label="Keyboard">
    <div v-for="(row, i) in ROWS" :key="i" class="krow">
      <button
        v-if="i === 2"
        class="key wide"
        type="button"
        :disabled="props.disabled"
        @click="emit('enter')"
      >
        Enter
      </button>

      <button
        v-for="char in row"
        :key="char"
        class="key"
        :class="props.states.get(char) ? `is-${props.states.get(char)}` : ''"
        type="button"
        :disabled="props.disabled"
        :aria-label="`${char}${props.states.get(char) ? `, ${props.states.get(char)}` : ''}`"
        @click="emit('letter', char)"
      >
        {{ char }}
      </button>

      <button
        v-if="i === 2"
        class="key wide"
        type="button"
        :disabled="props.disabled"
        aria-label="Backspace"
        @click="emit('backspace')"
      >
        ⌫
      </button>
    </div>
  </div>
</template>

<style scoped>
.keyboard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(500px, 96vw);
  margin-inline: auto;
}

.krow {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.key {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.9rem 0.25rem;
  border: 0;
  border-radius: 4px;
  background: var(--key-bg);
  color: var(--key-fg);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.key:hover:not(:disabled) {
  background: var(--key-bg-hover);
}

.key:disabled {
  cursor: default;
  opacity: 0.6;
}

.wide {
  flex: 1.6 1 0;
  font-size: 0.7rem;
}

/*
  Same semantic-state mapping as WordTile, intentionally duplicated rather
  than shared: these are two components with their own local styles, which is
  the whole point of `scoped` (ADR-0003). Both read the same CSS custom
  properties, so a theme change is still one place — the variables in
  App.vue, not these rules.
*/
.is-exact {
  background: var(--state-exact);
  color: var(--on-state);
}

.is-present {
  background: var(--state-present);
  color: var(--on-state);
}

.is-absent {
  background: var(--state-absent);
  color: var(--on-state);
}
</style>

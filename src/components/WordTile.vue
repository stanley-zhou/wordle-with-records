<script setup lang="ts">
import type { LetterState } from '@/game/types'

const props = defineProps<{
  letter: string
  /** Undefined while the row is unsubmitted — no feedback exists yet. */
  state?: LetterState
  /** True for the row the player is currently typing into. */
  active?: boolean
}>()
</script>

<template>
  <div
    class="tile"
    :class="[props.state ? `is-${props.state}` : 'is-empty', { 'is-active': props.active }]"
    :data-state="props.state ?? 'empty'"
  >
    {{ props.letter }}
  </div>
</template>

<style scoped>
/*
  `scoped` is the whole brief: "scoped CSS so styles stay component-local"
  (founding message, recorded in ADR-0003). The compiler rewrites `.tile`
  below to `.tile[data-v-...]`, so this `.tile` cannot reach a `.tile` in any
  other component. It is compiler-enforced locality, not a naming convention.
*/

.tile {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  width: 100%;
  border: 2px solid var(--tile-border);
  border-radius: 4px;
  background: var(--tile-bg);
  color: var(--tile-fg);
  font-size: clamp(1.25rem, 7vw, 2rem);
  font-weight: 700;
  text-transform: uppercase;
  user-select: none;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.is-empty {
  --tile-bg: transparent;
  --tile-fg: var(--fg);
  --tile-border: var(--line);
}

.is-active {
  --tile-border: var(--line-strong);
}

/*
  The ONLY place in the codebase that maps a semantic letter state to a
  colour. The scorer returns 'exact' | 'present' | 'absent' and is forbidden
  to know about colour (ADR-0001's standing constraint), precisely so that a
  high-contrast or colour-blind palette is a change to these three rules and
  nothing else. ADR-0003's open follow-up on the 8%-of-men red-green case
  lands here when we take it.
*/
.is-exact {
  --tile-bg: var(--state-exact);
  --tile-fg: var(--on-state);
  --tile-border: var(--state-exact);
}

.is-present {
  --tile-bg: var(--state-present);
  --tile-fg: var(--on-state);
  --tile-border: var(--state-present);
}

.is-absent {
  --tile-bg: var(--state-absent);
  --tile-fg: var(--on-state);
  --tile-border: var(--state-absent);
}
</style>

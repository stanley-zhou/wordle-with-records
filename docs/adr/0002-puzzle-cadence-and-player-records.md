<!-- adr template version: "adr 3.12.0" -->

# ADR-0002: Puzzle cadence and player records

- **Date**: 2026-11-12
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Yuxiang Zhou (Stanley), Setter 5 (Claude Opus 5, 1M context)

**TL;DR**: Decides whether everyone plays the same puzzle today or plays as many as they like — and what "records" in this repo's name is actually supposed to mean.

---

## Originating Context

**Source**: `Human dump` — the founding message, 2026-11-12 (quoted in [ADR-0001](0001-answer-corpus-and-guess-validation.md)); plus `Code review / observation` — the repository is named **wordle-with-records**, and that word is doing unexplained work.

Cadence came up because of what the hosting constraint implies. On GitHub Pages there is no server, so there is nothing to tell the browser what today's puzzle is; a shared daily puzzle has to be *computed* from the date by every client independently. That is easy, but it has consequences (timezones, clock-tampering, the whole corpus shipping in the bundle) that belong in a record rather than in a function nobody revisits.

**Agency Grant**: Explore options and recommend; Stanley decides before implementation begins.

---

## Explicitation

**What I understand**:

1. **Cadence is architecture, not a feature flag.** "One puzzle per day, shared by everyone" and "play as many as you like" differ in what state has to be stored, what a streak means, whether a result is shareable, and whether the corpus is a schedule or a bag. Retrofitting either onto the other touches every component.
2. **No backend means the date is the only shared coordinate available.** A date-seeded index into the answer list (`index = daysSince(EPOCH) % answers.length`) is deterministic across clients with no server, which is precisely how the original Wordle worked before it had accounts.
3. **The repo name contains a word I cannot resolve from context.** "Records" has at least two plausible readings here and they imply completely different amounts of work. That is QST-RECORDS-MEANING below, and I would rather ask than guess — guessing it would silently add or drop a feature.

**Assumptions**:

- **Any per-player state lives in `localStorage` and nowhere else.** No accounts, no sync, no database — consistent with the free-static-hosting constraint. Consequence to accept deliberately: progress is per-browser, clearing site data wipes it, and a player's phone and laptop are strangers to each other.
- **Clock-tampering is not defended against.** A player who sets their system date forward gets tomorrow's puzzle. With no server there is no authority to say otherwise, and this is a word game.

**Confirm**: Stanley — chiefly on what "records" was meant to mean, since I built the ADR numbering around my own reading of it.

---

## Questions

### QST-RECORDS-MEANING: What does "records" in `wordle-with-records` refer to?
- Status: answered
- Why asking: I cannot tell from the repo name alone, and the two readings differ by a whole feature. Reading one: **player records** — stats, streaks, a win-distribution histogram, personal bests; that is a real chunk of UI and state design. Reading two: **the records in this methodology's sense** — the ADRs, the deliberative substrate, i.e. "a Wordle, built with records" — in which case the name describes *how* the project is made and implies no gameplay feature at all. The fact that you brought me in on a template whose entire premise is records, and described the project as "my first deliberatively-built project," makes me suspect reading two. But building a stats panel nobody asked for, or omitting one that was the point of the name, are both bad outcomes, so this is worth one line from you. Everything else in this ADR is downstream of the answer.
- Need: pick a letter (or override — any shape answers; a sentence about what you had in mind beats a letter)

Options:
- **A — The method**: "records" = the ADRs. The name describes how the project is built, not what the game does. No stats feature is implied; whatever gameplay persistence exists is there because the game needs it, not because the name promised it.
- **B — The player's**: "records" = the player's statistics. Streaks, games played, win rate, guess-distribution histogram, personal bests. A deliberate, named feature of the product, and it would deserve its own ADR.
- **C — Both, and the pun is the point**: the name means the ADRs *and* the game tracks player records — the double meaning is intentional.

**Recommendation**: (by Setter 5, Claude Opus 5, 1M context, 2026-11-12)

**A — the method**, with B deliberately deferred rather than dropped. *Rationale*: The evidence in the repo points at the methodology: this is a fresh instance of a human-AI collaboration template whose whole subject is ADRs, your founding message called it "my first deliberatively-built project," and the message spends its words on the twist, the hosting, and Vue — never on stats. Against that, "records" reads naturally as high-scores to anyone who sees only the repo name. Treating it as A costs nothing recoverable: a scoring-history feature is additive and can arrive as its own ADR, whereas building it now on a guess spends your review attention on a feature you may not want. *Confidence*: 0.7 — because the contextual evidence genuinely leans this way, but it is inference about your intent from a repo name, and you are the only source of truth; this is squarely in the "your call" band. *If wrong*: if you say you meant player stats, this flips to **B** and a win-distribution histogram plus streak tracking joins the v1 scope as its own ADR — and it makes QST-CADENCE's answer load-bearing rather than merely consequential, because a streak is meaningless without a daily cadence to break.

**ANS:** (by Yuxiang Zhou)
A — "records" means the decision records. The name comes from the course guide, whose whole point is decisions on the record. No player stats or streaks in v1; if I want them later, that's a new QST.

---

### QST-CADENCE: One shared puzzle per day, or unlimited play?
- Status: answered
- Why asking: This decides what the app *is*, and it is hard to change later because streaks, sharing, and stored state all hang off it. It also interacts with the corpus size from [ADR-0001](0001-answer-corpus-and-guess-validation.md#qst-corpus-provenance): a daily puzzle consumes one word per day, so a ~300-word CS corpus is roughly ten months before repeats (Wordle's 2,315 bought about six years). And with no backend, a "daily" puzzle is whatever the player's own clock says — which raises a question Wordle itself had to answer: does the day roll over at local midnight (everyone gets a puzzle at their own midnight, but neighbours in different timezones briefly hold different answers) or at UTC midnight (one global answer at any instant, but it flips mid-evening for some players)?
- Need: pick a letter (or override — any shape answers)

Options:
- **A — Daily, local midnight**: one puzzle per calendar day, index derived from the player's local date. Feels right to each individual player; two players on either side of a date line can disagree about "today's word," which makes result-sharing ambiguous.
- **B — Daily, UTC midnight**: one puzzle per UTC day. Everyone on earth holds the same answer at the same instant, so sharing and comparing are unambiguous. Rollover lands at an odd local hour for most of the world — 7 or 8 PM in the Americas, mid-morning in East Asia.
- **C — Endless practice**: no calendar at all; a new random puzzle whenever the player wants one. Simplest to build, no date logic, no rollover question, and the ~300-word corpus is a bag rather than a schedule. Costs the daily ritual and makes streaks meaningless.
- **D — Both modes**: a dated daily puzzle *and* an endless practice mode, with separate state. The most generous to players and the most code: two state shapes, two UI entry points, and a real question about whether practice games pollute the stats.

**Recommendation**: (by Setter 5, Claude Opus 5, 1M context, 2026-11-12)

**C — endless practice for v1, with the daily puzzle as the next ADR, not as never.** *Rationale*: I am recommending against the Wordle-shaped answer on purpose, so here is the trace. The daily ritual is most of what made Wordle spread, but it is powered by a shared audience comparing results — and a brand-new CS-vocabulary game on a personal GitHub Pages URL does not have one on day one, so the daily constraint would deliver the cost (one puzzle a day, rollover semantics, a corpus that expires in ~10 months per ADR-0001) without the benefit. Endless play is also what makes the thing *testable by its author*: you cannot playtest a feedback scorer, or notice that your corpus contains three near-duplicate plurals, at a rate of one word per day. And the migration runs in the easy direction — a date-seeded index is a pure function of the corpus and the date, so adding mode B later touches the puzzle-selection module and nothing else, whereas starting daily and discovering the corpus is too thin means rationing a game nobody is playing yet. *Confidence*: 0.75 — because the build-order argument is solid and the migration really is local, but "no shared audience yet" is a judgment about your ambitions for the project rather than a measurement, and if you intend to launch this to a cohort (a class, a Discord, a team) the daily ritual is the entire point and I am wrong. *If wrong*: if you are shipping this to an actual group who will compare results, this flips to **B** — UTC rollover, because cross-timezone comparability is the one thing a shared audience needs and local-midnight quietly breaks it.

**ANS:** (by Yuxiang Zhou)
C — this is a personal practice project with no shared audience yet, and endless mode lets me playtest the scorer and corpus. Reopen as B (UTC daily) if I share it with the class.

---

## Supporting Materials

### COD: why the daily index is a pure function, and therefore cheap to add later
```ts
// The whole of "daily puzzle" on a backend-less host. This is the argument
// for QST-CADENCE option C: deferring the daily mode defers ~10 lines,
// not an architecture.

const EPOCH = Date.UTC(2026, 0, 1);          // puzzle #0; never change once shipped
const DAY   = 86_400_000;

function dailyIndex(now: Date, corpusSize: number): number {
  const days = Math.floor((now.getTime() - EPOCH) / DAY);   // UTC rollover (option B)
  return ((days % corpusSize) + corpusSize) % corpusSize;    // guard pre-epoch clocks
}

// Two notes that belong in the record rather than in a comment nobody reads:
//  - EPOCH is frozen at first deploy. Moving it renumbers every past puzzle and
//    desynchronises anyone mid-game, which is exactly the class of bug a date
//    seed invites.
//  - `% corpusSize` means the corpus is a RING, so adding words mid-life shifts
//    the whole future schedule. If repeats ever matter, the fix is a committed
//    shuffled order, not a longer list.
```

### FIL: where this lands in code
- `src/game/puzzle.ts` — puzzle selection. The entire cadence decision lives behind this one module's interface, which is what makes option C cheap to revise.
- `src/game/persist.ts` — `localStorage` read/write. Shape depends on QST-RECORDS-MEANING.

---

## Decision

### Context
A backend-less word game has to decide whether its puzzles are a calendar or a faucet, and this project's name hints at a stats feature whose existence has not been confirmed.

### Options
Enumerated per-question above (QST-RECORDS-MEANING A–C, QST-CADENCE A–D).

### Chosen: endless practice, no calendar, no player statistics in v1

Concretely:
1. **"Records" means the decision records** — the ADRs. It describes how the project is built, not a game feature. The name comes from the course guide Stanley is working through, whose subject is decisions on the record.
2. **No stats, streaks, histograms, or personal bests in v1.** Not deferred vaguely: explicitly out, and a new question if Stanley wants them.
3. **Endless practice.** A fresh puzzle whenever the player asks for one. No date logic, no rollover semantics, no epoch.
4. **Cadence stays isolated behind `src/game/puzzle.ts`** so reopening as UTC-daily is a change to one module, which is the condition that made choosing C safe rather than merely cheap.

**Rationale**: Both answers came back matching the recommendations, and the reasons Stanley gave are worth recording because they are better evidence than my inference was. On "records" I had argued from context at confidence 0.7 — the strongest hedge in the whole set, because it was inference about intent from a repository name. His answer supplies the fact I was missing: the name comes from the course guide, so the word was always pointing at the ADRs. On cadence, my case against the Wordle-shaped default rested on there being no shared audience yet and on the author's need to playtest the scorer; he confirmed both and named the exact falsifier back to me — *"reopen as B (UTC daily) if I share it with the class."* That is the ORRCF form working in the direction it was designed for: the falsifier came back as a trigger rather than being discarded with the option.

**Trade-offs accepted**:
- **No daily ritual, so no viral loop.** Deliberate: the ritual needs an audience comparing results, and the project does not have one yet.
- **No emoji-grid share text.** It is most of how Wordle spread and it is nearly free to build, but it is incoherent without a shared puzzle. Parked, not forgotten.
- **Streaks are meaningless under endless play**, which is part of why item 2 costs nothing today.
- **`localStorage` only** — per-browser, lost with site data, phone and laptop are strangers. The price of free static hosting.

### Consequences
- `src/game/puzzle.ts` owns puzzle selection and nothing else imports a cadence assumption. The date-seeded `dailyIndex` sketch in the COD block below is deliberately *not* implemented, but stays in the record as the thing that drops in behind this interface if cadence reopens.
- `src/game/persist.ts` stores only what the game needs to survive a reload — the in-progress board — and no aggregate history. Item 2 is a shape decision, not just a missing screen.
- The stale-partial-board trap below is now live rather than hypothetical: with endless play there is no date to invalidate a saved board against, so the stored state must carry the puzzle's own identity or a reload will restore guesses against a different answer. This is the one concrete bug endless mode introduces that daily mode would have prevented, and it is named here before it is written.
- If cadence reopens as UTC-daily, `EPOCH` is frozen at that deploy and never moved; moving it renumbers every past puzzle.

---

## Open Follow-ups

- [ ] **Concern — `localStorage` is the whole persistence story, and it is lossy.** Per-browser, cleared with site data, no sync between a player's phone and laptop. Accepted under the free-hosting constraint, named here so it is a decision rather than a surprise.
- [ ] **Concern, now sharpened by the endless choice — the stale partial board.** A reload mid-puzzle should restore the player's guesses, which means persisting a partial board. Under a *daily* cadence the date invalidates a stale board for free; under endless play there is no such key, so a restored board can be replayed against a different answer — a wrong-but-plausible game state, which is the worst kind. Fix is cheap and must be deliberate: store the puzzle's own identity alongside the board and discard on mismatch. Promoted from "cheap to build correctly" to a named consequence of QST-CADENCE's answer.
- [x] **Resolved — result sharing.** Moot under endless play: an emoji grid with no shared puzzle is a picture of nothing. Returns with cadence option B if the class ever gets it.
- [x] **Resolved — clock-tampering.** Moot: endless play reads no clock, so there is nothing to tamper with. Returns with cadence option B.
- [ ] **Future task — player statistics, explicitly out of v1 rather than overlooked.** QST-RECORDS-MEANING ruled A, so there is no stats feature. If Stanley wants one it is a new question and its own ADR, and it would make cadence load-bearing rather than merely consequential — a streak needs a day to break.

---

## Action Items

- [x] Answer QST-RECORDS-MEANING — Owner: Stanley — **done 2026-11-12: A, the decision records**
- [x] Answer QST-CADENCE — Owner: Stanley — **done 2026-11-12: C, endless**
- [x] If QST-RECORDS-MEANING resolves to B or C, mint a stats ADR — Owner: Setter 5 — **not triggered; A ruled**
- [ ] Put cadence behind `src/game/puzzle.ts`, so reopening as UTC-daily stays a one-module change — Owner: Setter 5
- [ ] Store the puzzle's identity with the saved board and discard on mismatch — the stale-board trap endless mode introduces — Owner: Setter 5

---

## Validation

- [x] Stanley: "records" is correctly interpreted — confirmed, and he supplied the fact I lacked (the course guide)
- [x] Stanley: the cadence options cover what I had in mind — answered C within the space, and handed the falsifier back as a trigger
- [ ] Setter 5: cadence is isolated behind one module, so the answer stays cheap to change
- [ ] Setter 5: the saved board carries its puzzle's identity — verify by reloading mid-game after switching puzzles, not by reading the code

**Notes**: I recommended against the Wordle-shaped default on QST-CADENCE. That is the kind of lean most worth checking, so the Rationale states the build-order argument explicitly and names the single fact — whether this ships to a real audience — that would reverse it. Worth recording that it came back *confirmed with its trigger attached* ("reopen as B if I share it with the class"), which is the falsifier surviving the decision instead of being discarded with the rejected options. QST-RECORDS-MEANING is the companion lesson in the other direction: it was my lowest-confidence call at 0.7, it was right, and it was right for a reason I did not have — the hedge was honest rather than decorative.

---

## Iterations

### Iteration 1 (2026-11-12)
- Trigger: Project founding message; plus the unexplained word "records" in the repository name.
- Contributors: Setter 5 (Claude Opus 5, 1M context)
- Changes: Initial draft. Two questions: what "records" means, and what cadence the game runs on.
- Outcome: Status `Draft`; awaiting answers.

### Iteration 2 (2026-11-12)
- Trigger: Stanley answered both questions in one pass.
- Contributors: Yuxiang Zhou (answers), Setter 5 (Claude Opus 5, 1M context — decision write-up)
- Changes: QST-RECORDS-MEANING → `answered` (**A**, the decision records; the name comes from the course guide, which is the fact my 0.7-confidence inference was missing). QST-CADENCE → `answered` (**C**, endless, with "reopen as B if I share it with the class" recorded as the live trigger). Decision section written. Two follow-ups went moot under endless play (sharing, clock-tampering), one was sharpened into a real consequence (the stale partial board, which daily cadence would have invalidated for free), and the no-stats ruling was written down as explicitly-out rather than left as an absence.
- Outcome: Status `Draft` → `Accepted`. All questions closed; implementation unblocked.

---

## Glossary

- **Cadence**: the rule that decides which puzzle a player gets when they open the app — a calendar, or a random draw.
- **Rollover**: the instant the daily puzzle changes. Local-midnight and UTC-midnight rollover are different products, not different settings.
- **Epoch**: the fixed start date a daily index counts from. Frozen at first deploy; moving it renumbers history.

---

## Links

- Related ADRs: [ADR-0001 — answer corpus and guess validation](0001-answer-corpus-and-guess-validation.md) (corpus size is a schedule under a daily cadence); [ADR-0003 — build, hosting and deploy topology](0003-build-hosting-and-deploy-topology.md) (the no-backend constraint that forces a date seed)
- Related code: none yet — this ADR precedes implementation by design

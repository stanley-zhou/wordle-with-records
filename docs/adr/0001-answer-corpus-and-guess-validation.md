<!-- adr template version: "adr 3.12.0" -->

# ADR-0001: Answer corpus and guess validation

- **Date**: 2026-11-12
- **Iteration**: 1
- **Status**: Draft
- **Deciders**: Yuxiang Zhou (Stanley), Setter 5 (Claude Opus 5, 1M context)

**TL;DR**: The CS-vocabulary answer list is the product; this ADR decides what the player is allowed to *type*, and where the words come from.

---

## Originating Context

**Source**: `Human dump (below)` — the project's founding message, 2026-11-12.

> "The project is a Wordle variant — guess the word, colored feedback per letter — with a twist: the answers are computer science words (ARRAY, STACK, QUEUE, CACHE, TOKEN…). I want it hosted free on GitHub Pages, built with Vue using scoped CSS so styles stay component-local. Before you write any code: what are the 2–3 decisions we should settle first?"

**Agency Grant**: Explore options and recommend; Stanley decides before implementation begins.

---

## Explicitation

*Making explicit what the Originating Context implied or contained tacitly.*

**What I understand**:

1. **The twist is the vocabulary, not the mechanics.** Wordle's rules are well-known and well-loved; the novelty here is that every answer is a CS term. That means the word list is not a data file bolted on at the end — it is the thing the player came for, and the hardest part to get right. It deserves the first ADR.
2. **"Legal guess" is a separate concept from "possible answer," and conflating them breaks the game.** This is the non-obvious consequence of a themed answer list, and it is QST-GUESS-LEGALITY below.
3. **Static hosting means the whole corpus ships to the browser.** There is no server, so there is no hiding place. Every answer is in the JS bundle, readable by anyone who opens devtools.

**Assumptions** (stated, not asked — say the word if any is wrong):

- **All answers are exactly five letters.** Every example Stanley gave — ARRAY, STACK, QUEUE, CACHE, TOKEN — is five letters, and five is what makes Wordle's feedback grammar learnable. Not spending a QST card on this. The implementation hedge: the puzzle record carries its own length (`{ word, length }`) rather than hardcoding `5` across the board, keyboard, and scorer, so a mixed-length mode later is a data change rather than a rewrite.
- **Answers are uppercase A–Z only.** No digits, no hyphens, no spaces — which silently excludes a lot of real CS vocabulary (`O(n)`, `B-TREE`, `2FA`, `BIG-O`) and that is fine.
- **Spoiler-resistance is not a goal.** Since the corpus ships in the bundle, a determined player can read tomorrow's answer. Designing against that would require a backend and defeat the free-hosting constraint. The corpus must therefore contain nothing we would mind being read — which is already true of a CS glossary.

**Confirm**: Stanley — especially the five-letter assumption, since every downstream decision leans on it.

---

## Questions

### QST-GUESS-LEGALITY: What counts as a legal guess?
- Status: unanswered
- Why asking: This is the single decision that most changes how the game *feels*, and it is invisible until you play. The answers are CS words — but may the player *type* non-CS words? A themed answer list is small (my enumeration estimate: 250–400 solid five-letter CS terms). If the guess list is also that small, the player has no throwaway probe words, so every guess must be a word they believe could be the answer, and the game stops being deduction and becomes recall-the-list. Wordle itself split these two lists for exactly this reason: the original shipped **2,315 possible answers against 12,972 legal guesses** — a 5.6× gap that exists so players can burn turn one on a vowel-heavy probe like ADIEU or CRANE. Whichever way this goes also determines whether we ship an English dictionary asset at all, which is why it blocks code.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — Purist**: a guess is legal only if it is in the CS answer list. Thematically airtight, and the game becomes a vocabulary drill. Cost: with ~300 legal words, the player hits "not in word list" constantly, and strategic probing is impossible.
- **B — Wordle's own split**: answers come from the curated CS list; guesses are validated against a standard English five-letter dictionary (the CS list unioned in, so every answer is trivially a legal guess). Preserves normal Wordle strategy. Cost: one dictionary asset (~13k words, roughly 50–80 KB gzipped) and the mild oddity that WHARF is a legal guess in a CS game.
- **C — Split, with the theme signposted**: B, plus the UI marks which guessed words are in the CS set (a small badge, or a distinct tile border), so the player learns the themed subset by playing instead of by being blocked. Cost: B's cost plus real UI work, and a new visual channel competing with the three feedback colors.
- **D — Permissive**: accept any five A–Z letters, no dictionary at all. Smallest bundle, zero validation code. Cost: `QQQQQ` becomes a legal probe, which lets a player trivially binary-search the alphabet and removes the game's central constraint.

**Recommendation**: (by Setter 5, Claude Opus 5 (1M context), 2026-11-12)

**B — Wordle's own split.** *Rationale*: The 5.6× gap between Wordle's 12,972 guesses and 2,315 answers is not an accident of implementation, it is the load-bearing design choice that makes opening probes possible, and a themed answer list makes the ratio *worse* (~300 answers), not better — so the game needs the open guess list more than Wordle did, not less. A is the version where the player's skill is remembering our list rather than reasoning about letters; D removes the constraint that makes the game a game. C is genuinely attractive and I would like to get there, but it adds a fourth visual channel to a board that already encodes meaning in three colors, and it should be its own decision once the base game is playable and we can look at it. *Confidence*: 0.85 — because the answers/guesses split is directly observable in Wordle's own shipped source and the reasoning transfers cleanly, but I have not playtested a themed variant, and "constantly rejected guesses" is my prediction about fun, not a measurement. *If wrong*: if playtesting shows players *enjoy* being confined to CS vocabulary — that the rejection is a teaching signal rather than an annoyance — this flips to **A**, and the dictionary asset is deleted rather than refactored.

**ANS:** (by Stanley)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

### QST-CORPUS-PROVENANCE: Where does the CS word list come from, and who signs off on it?
- Status: unanswered
- Why asking: Nobody has a list of 300 five-letter CS terms lying around; it has to be produced, and *how* it is produced decides three things at once. (i) **Licensing** — a list scraped from someone's glossary is a derived work sitting in a public repo under your name. (ii) **Quality** — a generated list will confidently include words that are not CS terms (GRAPH yes; GRASP no) and will miss obvious ones, and nobody will notice until a player does. (iii) **Who is on the hook for upkeep**, since this list will be edited for the life of the project. Also note it interacts with QST-CADENCE in ADR-0002: a daily puzzle consumes the corpus at one word per day, so corpus size is a schedule.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — Hand-curated, committed**: a JSON/TS file in this repo, written and reviewed by us, every change a reviewable diff. Clear provenance, full editorial control, and git blame tells you who added ZLIBS and why. Cost: a few hours of real work, and the list starts small.
- **B — Derived from an external source**: pull a CS glossary or dataset at build time and filter to five letters. Fast and large. Cost: licence and attribution questions on a public repo, a build-time network dependency, and the output needs reviewing anyway because glossary entries are not all good puzzle words.
- **C — I draft, you ratify**: I generate a candidate list with a definition beside each word, you read it once and strike what you dislike; the surviving list is committed as in A. Cost: one review sitting from you, and my drafting errors are yours to catch.

**Recommendation**: (by Setter 5, Claude Opus 5 (1M context), 2026-11-12)

**C — I draft, you ratify, and the committed artifact is A.** *Rationale*: These are not really rivals: A describes the *artifact* we want (reviewed, in-repo, diffable, unambiguously ours) and B and C describe how to *get* a first draft. B's licence question is a real cost for a public repo and buys little, since glossary output needs the same human pass that C needs. C puts the expensive part — judging whether a word is a fair CS answer — in front of the one person who should judge it, while the tedious part is mine. Concretely: I produce a table of candidates with a gloss and a confidence per word, you strike rows, the survivor set lands as `src/data/answers.json` with a `NOT:` header recording how it was built. *Confidence*: 0.9 — because the artifact shape (A) is the only one of the three with clean provenance, and C is just the cheapest honest route to it. *If wrong*: if your review of my draft rejects more than roughly a third of the candidates, my judgment of "is this a CS word" is not calibrated to yours, and this flips to you seeding the list from your own coursework or notes with me only formatting and deduplicating.

**ANS:** (by Stanley)
[Fill this in]   <!-- literal placeholder — parser-significant, do not paraphrase -->

---

## Supporting Materials

### FIL: where this lands in code
- `src/data/answers.json` — the curated CS answer corpus (QST-CORPUS-PROVENANCE). Reviewable, diffable, one word per line-ish.
- `src/data/guessable.json` — the English five-letter dictionary, only if QST-GUESS-LEGALITY resolves to B or C. Deleted if A.
- `src/game/score.ts` — the per-letter feedback scorer. Named here because it is the one function in this project with a genuinely tricky algorithm and the Fifth Directive's gate is specified around it.

### COD: the duplicate-letter trap the scorer must not fall into
```js
// The naive scorer marks each guess letter independently against the answer,
// and is WRONG whenever a letter repeats. Answer SEEDS, guess GEESE:
//
//   naive:   G=absent  E=present  E=present  S=present  E=present   <- three E hints
//   correct: G=absent  E=absent   E=exact    S=present  E=present   <- two
//
// The answer has two E's, so at most two E's in the guess may be marked.
// Correct algorithm is two passes: first claim every exact position, then
// distribute the REMAINING unclaimed answer letters to the leftovers,
// left to right. A one-pass scorer passes casual play and silently lies.
//
// This is the regression test named in CLAUDE.md's Fifth Directive, and it
// exists before the implementation on purpose.
```

---

## Decision

### Context
A themed Wordle has a small answer pool and a vocabulary the player may not fully know. Both facts push on the guess-validation rule, and the answer pool has to be built by hand before anything is playable.

### Options
Enumerated per-question above (QST-GUESS-LEGALITY A–D, QST-CORPUS-PROVENANCE A–C) rather than duplicated here.

### Chosen: *pending Stanley's answers*

**Rationale**: [To be written from the answers — the thinking trace, not a restatement of the pick.]

**Trade-offs accepted**: [To be written at decision time.]

### Consequences
[To be written at decision time.]

---

## Open Follow-ups

*Surfaced while writing this ADR; not blocking it.*

- [ ] **Concern — corpus size is a schedule, not just a number.** If ADR-0002 chooses a daily puzzle, ~300 answers is roughly ten months of play before repeats; Wordle's 2,315 bought about six years. Worth knowing the real count before locking cadence. Cheap to resolve: build the list, then count.
- [ ] **Future task — plural and inflected forms.** NODES, TREES, BYTES, CACHES are fair play but inflate the list with near-duplicates of their singulars. Decide a policy during the curation sitting, not during implementation.
- [ ] **Unverified assumption — my 250–400 estimate.** It is an enumeration guess, not a count. Verify before it is cited as a constraint anywhere.
- [ ] **Future task — definitions as a post-game reward.** If the corpus carries a one-line gloss per word (which QST-CORPUS-PROVENANCE option C produces anyway), showing it after the final guess turns a loss into something learned. Free upside; its own ADR if we want it.

---

## Action Items

- [ ] Answer QST-GUESS-LEGALITY — Owner: Stanley
- [ ] Answer QST-CORPUS-PROVENANCE — Owner: Stanley
- [ ] Draft the candidate corpus with glosses, once provenance is settled — Owner: Setter 5
- [ ] Write `src/game/score.ts` with the duplicate-letter regression test *first* — Owner: Setter 5

---

## Validation

- [ ] Stanley: the five-letter assumption is correct
- [ ] Stanley: the guess-legality options cover the space I care about
- [ ] Setter 5: the scorer's duplicate-letter contract is captured before implementation

**Notes**: The spoiler point in Explicitation is a consequence of free static hosting, not an oversight — if hiding answers ever becomes a requirement, it reopens ADR-0003's hosting choice, not this ADR.

---

## Iterations

### Iteration 1 (2026-11-12)
- Trigger: Project founding message from Stanley — "before you write any code, what should we settle first?"
- Contributors: Setter 5 (Claude Opus 5, 1M context)
- Changes: Initial draft. Two questions posed with recommendations; the five-letter answer length stated as an assumption rather than asked, to keep the first sitting short.
- Outcome: Status `Draft`; awaiting answers.

---

## Glossary

- **Answer corpus**: the curated set of words that can be the solution to a puzzle. Small, themed, ours.
- **Guess list**: the set of words a player is permitted to enter. A superset of the answer corpus in options B and C of QST-GUESS-LEGALITY; identical to it in option A.
- **Probe**: a guess played not because the player thinks it is the answer but to harvest letter information (ADIEU, CRANE). Probes are impossible when the guess list equals a small answer corpus.

---

## Links

- Related ADRs: [ADR-0002 — puzzle cadence and player records](0002-puzzle-cadence-and-player-records.md) (corpus size constrains cadence); [ADR-0003 — build, hosting and deploy topology](0003-build-hosting-and-deploy-topology.md) (the dictionary asset is a bundle-size decision there)
- Related code: none yet — this ADR precedes implementation by design

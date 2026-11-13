<!-- adr template version: "adr 3.12.0" -->

# ADR-0001: Answer corpus and guess validation

- **Date**: 2026-11-12
- **Iteration**: 2
- **Status**: Accepted
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
- Status: answered
- Why asking: This is the single decision that most changes how the game *feels*, and it is invisible until you play. The answers are CS words — but may the player *type* non-CS words? A themed answer list is small (my enumeration estimate: 250–400 solid five-letter CS terms). If the guess list is also that small, the player has no throwaway probe words, so every guess must be a word they believe could be the answer, and the game stops being deduction and becomes recall-the-list. Wordle itself split these two lists for exactly this reason: the original shipped **2,315 possible answers against 12,972 legal guesses** — a 5.6× gap that exists so players can burn turn one on a vowel-heavy probe like ADIEU or CRANE. Whichever way this goes also determines whether we ship an English dictionary asset at all, which is why it blocks code.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — Purist**: a guess is legal only if it is in the CS answer list. Thematically airtight, and the game becomes a vocabulary drill. Cost: with ~300 legal words, the player hits "not in word list" constantly, and strategic probing is impossible.
- **B — Wordle's own split**: answers come from the curated CS list; guesses are validated against a standard English five-letter dictionary (the CS list unioned in, so every answer is trivially a legal guess). Preserves normal Wordle strategy. Cost: one dictionary asset (~13k words, roughly 50–80 KB gzipped) and the mild oddity that WHARF is a legal guess in a CS game.
- **C — Split, with the theme signposted**: B, plus the UI marks which guessed words are in the CS set (a small badge, or a distinct tile border), so the player learns the themed subset by playing instead of by being blocked. Cost: B's cost plus real UI work, and a new visual channel competing with the three feedback colors.
- **D — Permissive**: accept any five A–Z letters, no dictionary at all. Smallest bundle, zero validation code. Cost: `QQQQQ` becomes a legal probe, which lets a player trivially binary-search the alphabet and removes the game's central constraint.

**Recommendation**: (by Setter 5, Claude Opus 5 (1M context), 2026-11-12)

**B — Wordle's own split.** *Rationale*: The 5.6× gap between Wordle's 12,972 guesses and 2,315 answers is not an accident of implementation, it is the load-bearing design choice that makes opening probes possible, and a themed answer list makes the ratio *worse* (~300 answers), not better — so the game needs the open guess list more than Wordle did, not less. A is the version where the player's skill is remembering our list rather than reasoning about letters; D removes the constraint that makes the game a game. C is genuinely attractive and I would like to get there, but it adds a fourth visual channel to a board that already encodes meaning in three colors, and it should be its own decision once the base game is playable and we can look at it. *Confidence*: 0.85 — because the answers/guesses split is directly observable in Wordle's own shipped source and the reasoning transfers cleanly, but I have not playtested a themed variant, and "constantly rejected guesses" is my prediction about fun, not a measurement. *If wrong*: if playtesting shows players *enjoy* being confined to CS vocabulary — that the rejection is a teaching signal rather than an annoyance — this flips to **A**, and the dictionary asset is deleted rather than refactored.

**ANS:** (by Yuxiang Zhou)
B — probes make deduction fun, and a ~300-word list makes them more necessary. Condition: the legal-guess dictionary needs a recorded source and licence, same standard as the answer corpus.

---

### QST-CORPUS-PROVENANCE: Where does the CS word list come from, and who signs off on it?
- Status: answered
- Why asking: Nobody has a list of 300 five-letter CS terms lying around; it has to be produced, and *how* it is produced decides three things at once. (i) **Licensing** — a list scraped from someone's glossary is a derived work sitting in a public repo under your name. (ii) **Quality** — a generated list will confidently include words that are not CS terms (GRAPH yes; GRASP no) and will miss obvious ones, and nobody will notice until a player does. (iii) **Who is on the hook for upkeep**, since this list will be edited for the life of the project. Also note it interacts with QST-CADENCE in ADR-0002: a daily puzzle consumes the corpus at one word per day, so corpus size is a schedule.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — Hand-curated, committed**: a JSON/TS file in this repo, written and reviewed by us, every change a reviewable diff. Clear provenance, full editorial control, and git blame tells you who added ZLIBS and why. Cost: a few hours of real work, and the list starts small.
- **B — Derived from an external source**: pull a CS glossary or dataset at build time and filter to five letters. Fast and large. Cost: licence and attribution questions on a public repo, a build-time network dependency, and the output needs reviewing anyway because glossary entries are not all good puzzle words.
- **C — I draft, you ratify**: I generate a candidate list with a definition beside each word, you read it once and strike what you dislike; the surviving list is committed as in A. Cost: one review sitting from you, and my drafting errors are yours to catch.

**Recommendation**: (by Setter 5, Claude Opus 5 (1M context), 2026-11-12)

**C — I draft, you ratify, and the committed artifact is A.** *Rationale*: These are not really rivals: A describes the *artifact* we want (reviewed, in-repo, diffable, unambiguously ours) and B and C describe how to *get* a first draft. B's licence question is a real cost for a public repo and buys little, since glossary output needs the same human pass that C needs. C puts the expensive part — judging whether a word is a fair CS answer — in front of the one person who should judge it, while the tedious part is mine. Concretely: I produce a table of candidates with a gloss and a confidence per word, you strike rows, the survivor set lands as `src/data/answers.json` with a `NOT:` header recording how it was built. *Confidence*: 0.9 — because the artifact shape (A) is the only one of the three with clean provenance, and C is just the cheapest honest route to it. *If wrong*: if your review of my draft rejects more than roughly a third of the candidates, my judgment of "is this a CS word" is not calibrated to yours, and this flips to you seeding the list from your own coursework or notes with me only formatting and deduplicating.

**ANS:** (by Yuxiang Zhou)
C into A, scaled down — a constraint you couldn't know: I have ~30 minutes tonight. Start with ~60 words I can review in one pass; grow toward 300 later with the same strike-a-row process. Does your recommendation survive that?

---

NOT: this answer opened a follow-up, carried below as QST-CORPUS-SCALE-60 — in my court, not Stanley's. Two repairs to the block the answer tool emitted, recorded rather than silently applied: its `**Follows up on**:` cross-reference sat bare beneath the ANS slot with no closing `---`, which makes the answer layer collect it *as part of the answer* (the adr-authoring skill's load-bearing-`---` rule; visible in the MCP read, where the reference was concatenated into the answer text). And its auto-derived handle, `QST-DOES-CA-STILL-HOLD-AT-A`, was slugified from the question's own wording — the shape the skill calls fragile, since retitling silently breaks every citation. Renamed to an explicit, stable handle while nothing outside this uncommitted edit cited it.

### QST-CORPUS-SCALE-60: Does C→A still hold at a 60-word v1, or does a small corpus change the guess-legality answer?
- Status: answered
- Why asking: Stanley answered QST-CORPUS-PROVENANCE with a constraint I could not have known — ~30 minutes tonight, so ~60 words rather than ~300 — and asked whether the recommendation survives it. It is two questions wearing one coat, and they have different answers. (i) Does the draft-and-ratify *method* still hold at a fifth of the batch size? (ii) Does a 60-word answer pool invalidate QST-GUESS-LEGALITY's **B**, which was argued *from* corpus smallness ("~300 answers make probes more necessary, not less") and therefore has to be re-checked when the corpus gets five times smaller still? Both block implementation, so both are answered here rather than deferred.
- Need: yes/no on each, plus any change to build order

Options:
- **A — Holds unchanged**: 60 is simply a smaller first batch. Both prior answers stand exactly as written, nothing about sequencing changes.
- **B — Holds, but the build order changes**: both prior answers stand on the merits, *and* the 60-word v1 makes the English dictionary no longer a precondition for a first playable build — guess validation goes behind an interface and the dictionary arrives second, once its licence is recorded.
- **C — Guess-legality flips**: 60 is small enough that open-English guessing breaks something structural, and QST-GUESS-LEGALITY's **A** (CS-only guesses) becomes the right answer after all.

**Recommendation**: (by Setter 5, Claude Opus 5 (1M context), 2026-11-12)

**B — both answers hold; only the build order changes.** *Rationale*: On the method, 60 does not weaken C→A, it is the batch size the method actually wanted: my stated falsifier was "if you strike more than roughly a third, my sense of a fair CS word is not calibrated to yours," and at 60 that reads as 20 struck rows — countable in one sitting tonight, where at 300 I would have learned the same thing after an hour of your attention instead of ten minutes. On guess-legality, the argument for **B** does not merely survive the smaller corpus, it is the *same* argument applied to a more extreme input: probes matter because the answer pool is small, so going from 300 to 60 strengthens it. Option **A** at 60 would be degenerate rather than merely strict — six guesses over 60 candidates means eliminating by letter solves most puzzles in about three guesses with no deduction at all, and the whole corpus is memorable in an evening, so the game would become a binary search over a list. What genuinely changes is sequencing: your condition on B — a recorded source and licence for the guess dictionary, held to the same standard as the answer corpus — makes that asset the long pole, and it is completely independent of the 60 words. So guess validation ships behind an interface whose v1 implementation is the CS list itself, and the dictionary drops in when its provenance is written down. That is not **A** creeping back under cover; it is **B** with its asset arriving second, and the interface is the thing that keeps the distinction honest. *Confidence*: 0.9 — because the method half is arithmetic on my own falsifier, and the guess-legality half is the same reasoning pushed further in the direction it already pointed; the sequencing claim is a build-order prediction I can verify by actually shipping the interface this session. *If wrong*: if sourcing a permissively-licensed five-letter English list turns out to be genuinely blocked — every candidate either proprietary (the Scrabble lists) or of unverifiable provenance — then **B** cannot be delivered at all and this flips to **C**: CS-only guessing becomes the permanent rule, the rejection friction gets reframed as the vocabulary-teaching signal that QST-GUESS-LEGALITY's own falsifier anticipated, and the interface built this session is where that change lands.

**ANS:** (by Setter 5, 2026-11-12)
B. Yes to both: draft-and-ratify holds at 60 (and the falsifier gets sharper, not blurrier), and the 60-word pool strengthens rather than threatens open-English guessing. The only change is build order — the dictionary stops being a precondition. Ruled in my own court under this ADR's Agency Grant; the reasoning is the Recommendation above, and the nullifier that would reopen it is a genuinely unobtainable licence, not a smaller corpus.

---

NOT: the 60-word pool does add one consequence that neither original question covered — see the memorability entry under Open Follow-ups, which carries a number and a trigger rather than a vague intention to grow the list.

---

## Supporting Materials

### FIL: where this lands in code
- `src/data/answers.json` — the curated CS answer corpus (QST-CORPUS-PROVENANCE). Reviewable, diffable, one word per line-ish.
- `src/data/guessable.json` — the English five-letter dictionary, only if QST-GUESS-LEGALITY resolves to B or C. Deleted if A.
- `src/game/score.ts` — the per-letter feedback scorer. Named here because it is the one function in this project with a genuinely tricky algorithm and the Fifth Directive's gate is specified around it.

### COD: the duplicate-letter trap the scorer must not fall into
```js
// The naive scorer claims exact positions, then marks every other guess
// letter "present" if it appears ANYWHERE in the answer. That is WRONG
// whenever a letter repeats.
//
//   answer   S E E D S
//   guess    G E E S E
//
//   naive:   absent  exact  exact  present  present   <- THREE E hints
//   correct: absent  exact  exact  present  absent    <- two
//
// The answer holds exactly two E's. Both are consumed by the exact matches
// at positions 2 and 3, so the guess's third E (position 5) has nothing
// left to claim and must read absent. The naive version hands the player a
// hint for a letter that isn't there.
//
// Correct algorithm is two passes: first claim every exact position AND
// tally only the answer letters those passes did NOT consume; then walk the
// leftovers left to right, spending from that tally. A one-pass scorer
// passes casual play and silently lies.
//
// (Corrected 2026-11-12, Iteration 2 — this block's first version mismarked
// positions 2-5 as absent/exact/present/present. It got the COUNT right, two
// E hints, and the POSITIONS wrong, which is precisely the error a worked
// example exists to prevent. Caught while writing the test the block
// specifies: the test is the artifact that checks the record, not just the
// code. Kept visible rather than quietly amended — a wrong worked example
// in a record is more dangerous than none, because it gets trusted.)
//
// This is the regression test named in CLAUDE.md's Fifth Directive, and it
// exists before the implementation on purpose.
```

---

## Decision

### Context
A themed Wordle has a small answer pool and a vocabulary the player may not fully know. Both facts push on the guess-validation rule, and the answer pool has to be built by hand before anything is playable.

### Options
Enumerated per-question above (QST-GUESS-LEGALITY A–D, QST-CORPUS-PROVENANCE A–C, QST-CORPUS-SCALE-60 A–C) rather than duplicated here.

### Chosen: open-English guessing over a hand-ratified CS answer corpus, starting at ~60 words

Concretely:
1. **Answers** come from a hand-ratified CS corpus committed to this repo — `src/data/answers.json`, every change a reviewable diff, provenance unambiguous.
2. **Guesses** are validated against a standard English five-letter dictionary with the CS corpus unioned in, so every answer is trivially legal. The dictionary must carry a recorded source and licence held to the same standard as the answer corpus (Stanley's condition on QST-GUESS-LEGALITY).
3. **v1 corpus size is ~60 words**, drafted by Setter 5 with a gloss per word, ratified by Stanley strike-a-row, growing toward ~300 by the same process.
4. **Guess validation ships behind an interface** whose v1 implementation is the CS corpus alone, so the first playable build does not wait on the dictionary's licence review.

**Rationale**: The thinking trace, not a restatement. Wordle's 2,315-answers-against-12,972-guesses split is the mechanism that makes an opening probe possible, and the themed corpus pushes the ratio the wrong way — so the open guess list is more necessary here than in the game it borrows from, not less. That argument was then stress-tested rather than assumed when Stanley's 30-minute constraint cut the corpus to 60: at 60 the conclusion holds *harder*, because CS-only guessing over 60 candidates with six attempts degenerates into elimination without deduction. On provenance, options A/B/C turned out not to be rivals — A names the artifact we want and B/C name routes to a first draft — so the decision is C *into* A, and the 60-word batch makes the method's own falsifier sharper: "more than a third struck" is 20 countable rows in one sitting instead of a vague sense after an hour. The only thing the smaller corpus actually changed was build order, which is why item 4 exists.

**Trade-offs accepted**:
- **The answers are readable in the bundle.** Static hosting has no hiding place; spoiler-resistance was never a goal (see Explicitation).
- **WHARF is a legal guess in a computer-science game.** The price of probes, and cheaper than the alternative.
- **A ~50–80 KB gzipped dictionary** for a 60-word answer pool — a ~1000× asset-to-corpus ratio that is nonetheless trivial for a web app, and lazily loaded so the board paints first.
- **60 answers is memorable.** Named with a number and a trigger under Open Follow-ups rather than waved at.
- **The dictionary may arrive late, or not at all.** Item 4 makes that survivable instead of blocking; the interface is where a forced retreat to CS-only guessing would land.

### Consequences
- `src/data/answers.json` is created this session from a drafted-and-ratified ~60-word list; the file carries a header recording how it was built.
- `src/game/validate.ts` exposes guess validation as an interface with a CS-corpus-only v1 implementation — the seam that makes the dictionary's arrival a swap rather than a refactor.
- `src/data/guessable.json` is **not** created until its source and licence are recorded in this ADR. Action item below names candidates and the proprietary traps.
- The scorer returns semantic states (`exact` / `present` / `absent`), never colours — the accessibility constraint from [ADR-0003](0003-build-hosting-and-deploy-topology.md)'s follow-ups, settled here because the scorer's return type is written this session.
- The duplicate-letter contract in the COD block above becomes a unit test *before* the implementation it guards, per CLAUDE.md's Third and Fifth Directives.
- One cheap UI disclosure follows from the 60-word pool: telling the player the answer is one of N computer-science words bounds a search space that otherwise feels like the whole 13k dictionary. One line, no new visual channel, and it does most of what QST-GUESS-LEGALITY's option C wanted without competing with the three feedback colours.

---

## Open Follow-ups

*Surfaced while writing this ADR; not blocking it.*

- [x] **Resolved — corpus size is a schedule, not just a number.** Moot as written: [ADR-0002](0002-puzzle-cadence-and-player-records.md#qst-cadence) chose endless play, so the corpus is a bag rather than a calendar and nothing expires. It returns in a different shape if cadence is ever reopened as daily — at 60 words a daily puzzle would repeat inside two months.
- [ ] **Concern — 60 answers is memorable, and that is the one real cost of the small v1.** Carrying a number and a trigger so this cannot be waved at: in endless mode a player doing ten puzzles in a sitting sees a sixth of a 60-word corpus in one evening, and the game stops being deduction once the pool is recalled rather than reasoned about. Trigger for growth: **when any play session repeats an answer the player has already solved**, the corpus is the binding constraint, not the UI. Target ~300 by the same strike-a-row process. This is corpus-growth scheduling and explicitly *not* a reopening of QST-GUESS-LEGALITY (ruled in QST-CORPUS-SCALE-60).
- [ ] **Blocking the dictionary, not the build — source and licence for the guess list.** Stanley's condition on QST-GUESS-LEGALITY. Candidates to evaluate: SCOWL-derived word lists and the public-domain-dedicated general English lists. **Known traps, named so nobody walks into them**: the Scrabble tournament lists (TWL/OWL, Collins) are proprietary and must not be used; and scraping NYT's Wordle bundle for its 12,972-word list inherits whatever rights sit on it. I have *not* verified any specific candidate's licence text and will not assert one from memory — verification is the action item, and `src/data/guessable.json` does not exist until its provenance is written into this ADR.
- [ ] **Future task — plural and inflected forms.** NODES, TREES, BYTES, CACHES are fair play but inflate the list with near-duplicates of their singulars. Policy decided during the ratification sitting, not during implementation. Acute at 60 words, where two near-duplicates are 3% of the game.
- [x] **Resolved — my 250–400 estimate.** No longer load-bearing: v1 is an explicit ~60 and the 300 target is a stated aim rather than an inferred ceiling. The estimate is still unverified; it is just no longer cited as a constraint anywhere.
- [ ] **Future task — definitions as a post-game reward.** The gloss per word exists anyway as a by-product of the ratification process, so showing it after the final guess turns a loss into something learned. Free upside; its own ADR if we want it.

---

## Action Items

- [x] Answer QST-GUESS-LEGALITY — Owner: Stanley — **done 2026-11-12: B, with a licence condition**
- [x] Answer QST-CORPUS-PROVENANCE — Owner: Stanley — **done 2026-11-12: C into A, scaled to ~60**
- [x] Answer QST-CORPUS-SCALE-60 — Owner: Setter 5 — **done 2026-11-12: B, build order only**
- [ ] Draft ~60 candidate words with a gloss and a confidence each, for strike-a-row review — Owner: Setter 5
- [ ] Ratify the draft (strike rows); >20 struck means recalibrate per the stated falsifier — Owner: Stanley
- [ ] Write `src/game/score.ts` with the duplicate-letter regression test *first* — Owner: Setter 5
- [ ] Write `src/game/validate.ts` as an interface, CS-corpus-only v1 implementation — Owner: Setter 5
- [ ] Verify a permissively-licensed five-letter English list, record source + licence in this ADR, *then* create `src/data/guessable.json` — Owner: Setter 5

---

## Validation

- [x] Stanley: the five-letter assumption is correct — not contested in the answering pass
- [x] Stanley: the guess-legality options cover the space I care about — answered B within the given space, adding a licence condition rather than a fourth option
- [ ] Setter 5: the scorer's duplicate-letter contract is captured before implementation — contract written (COD block); test pending
- [ ] Stanley: the ratified ~60-word corpus is one I am happy to put my name on
- [ ] Setter 5: `guessable.json` absent until its licence is recorded here — verify at the next gate run, since it is an absence and absences are the easy thing to stop checking

**Notes**: The spoiler point in Explicitation is a consequence of free static hosting, not an oversight — if hiding answers ever becomes a requirement, it reopens ADR-0003's hosting choice, not this ADR. Separately: QST-CORPUS-SCALE-60 is the first question in this project answered in the model's own court rather than the human's, under this ADR's Agency Grant. It is recorded as a full ORRCF recommendation *plus* a ruling for exactly that reason — a decision I make for myself should be at least as catchable as one I ask Stanley to make.

---

## Iterations

### Iteration 1 (2026-11-12)
- Trigger: Project founding message from Stanley — "before you write any code, what should we settle first?"
- Contributors: Setter 5 (Claude Opus 5, 1M context)
- Changes: Initial draft. Two questions posed with recommendations; the five-letter answer length stated as an assumption rather than asked, to keep the first sitting short.
- Outcome: Status `Draft`; awaiting answers.

### Iteration 2 (2026-11-12)
- Trigger: Stanley answered both questions in one pass, and his answer to QST-CORPUS-PROVENANCE carried a constraint I could not have known (~30 minutes tonight, so ~60 words) plus a question back: *"does your recommendation survive that?"*
- Contributors: Yuxiang Zhou (answers), Setter 5 (Claude Opus 5, 1M context — the follow-up ruling and the decision write-up)
- Changes: QST-GUESS-LEGALITY → `answered` (**B**, with a licence condition on the dictionary). QST-CORPUS-PROVENANCE → `answered` (**C into A**, batch cut to ~60). New QST-CORPUS-SCALE-60 answered in my own court (**B** — both prior answers hold, build order changes). Decision section written; two follow-ups resolved, two opened, one of them carrying a number and a trigger rather than an intention.
- Repairs recorded, not silent: the answer tool's `**Follows up on**:` line sat bare under an ANS slot with no closing `---`, which makes the answer layer read it as answer content — confirmed by the MCP returning it concatenated into the answer text. Fixed, and the follow-up's auto-derived handle (`QST-DOES-CA-STILL-HOLD-AT-A`, slugified from its own wording) renamed to the explicit, stable `QST-CORPUS-SCALE-60` while nothing outside the uncommitted edit cited it.
- Outcome: Status `Draft` → `Accepted`. All questions closed; implementation unblocked.

---

## Glossary

- **Answer corpus**: the curated set of words that can be the solution to a puzzle. Small, themed, ours.
- **Guess list**: the set of words a player is permitted to enter. A superset of the answer corpus in options B and C of QST-GUESS-LEGALITY; identical to it in option A.
- **Probe**: a guess played not because the player thinks it is the answer but to harvest letter information (ADIEU, CRANE). Probes are impossible when the guess list equals a small answer corpus.

---

## Links

- Related ADRs: [ADR-0002 — puzzle cadence and player records](0002-puzzle-cadence-and-player-records.md) (corpus size constrains cadence); [ADR-0003 — build, hosting and deploy topology](0003-build-hosting-and-deploy-topology.md) (the dictionary asset is a bundle-size decision there)
- Related code: none yet — this ADR precedes implementation by design

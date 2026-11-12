<!-- adr template version: "adr 3.12.0" -->

# ADR-0003: Build, hosting and deploy topology

- **Date**: 2026-11-12
- **Iteration**: 2
- **Status**: Accepted
- **Deciders**: Yuxiang Zhou (Stanley), Setter 5 (Claude Opus 5, 1M context)

**TL;DR**: Vue 3 + Vite, deployed to GitHub Pages by Actions — settling only the two choices that are expensive to reverse: typed or untyped, and which URL the site lives at.

---

## Originating Context

**Source**: `Human dump` — the founding message, 2026-11-12: *"I want it hosted free on GitHub Pages, built with Vue using scoped CSS so styles stay component-local."*

Three of the four things that message specifies are already decided by it: **GitHub Pages** (hosting), **Vue** (framework), **scoped CSS** (styling discipline). This ADR does not re-litigate them. It exists because two choices sit underneath them that are cheap now and expensive in a month — whether the code is typed, and what URL the site answers on — plus a handful of mechanical consequences that belong in the record rather than in tribal memory.

**Agency Grant**: Explore options and recommend; Stanley decides the two questions, and I implement the rest as I see fit.

---

## Explicitation

**What I understand**:

1. **"Scoped CSS so styles stay component-local" selects the toolchain, not just a preference.** Vue's `<style scoped>` is a Single-File-Component feature: the compiler rewrites selectors with a per-component data attribute at build time. That means SFCs, which means a build step, which means a bundler. It rules out the no-build CDN-script route for Vue entirely.
2. **GitHub Pages is a static file host.** No server-side code, no environment secrets, no API routes. Everything the game needs — corpus, dictionary, logic — ships to the browser. Already named as a consequence in [ADR-0001](0001-answer-corpus-and-guess-validation.md) (answers are readable) and [ADR-0002](0002-puzzle-cadence-and-player-records.md) (no server authority on "today").
3. **The base path is the classic way a Pages deploy fails.** A project site is served from a subdirectory (`/wordle-with-records/`), so a bundler that assumes root-absolute asset paths produces a page that works perfectly on `localhost:5173` and is a blank white screen in production. That is QST-SITE-URL below, and it is the single most likely first production bug in this project.

**Assumptions** (stated, not asked — these are reversible, so I am not spending cards on them):

- **Vite as the build tool**, which is Vue's own default scaffold (`npm create vue@latest`) and compiles SFCs including `<style scoped>` with no configuration.
- **Deploy via GitHub Actions' official Pages flow** (`actions/configure-pages` → `actions/upload-pages-artifact` → `actions/deploy-pages`), not by committing built output to a `gh-pages` branch. Built artifacts stay out of git history, and the deployed commit is traceable. Reversible in an afternoon if you would rather use the branch.
- **No router.** A Wordle is one screen; help and stats are modals. Adding `vue-router` to a static host also drags in the 404-fallback trick, which is complexity bought for nothing here.
- **Vitest for unit tests**, since it shares Vite's config and the Fifth Directive's gate names `npm run test:unit`.

**Confirm**: Stanley — on both assumptions and both questions; if you have a preference on any of the four, now is the cheap moment.

---

## Questions

### QST-TYPESCRIPT: TypeScript or plain JavaScript?
- Status: answered
- Why asking: It is the one toolchain choice that touches every file written after it, and converting a populated codebase later is real work rather than a flag. It is also a genuine fork for *this* project rather than a reflex, because the arguments cut both ways: the codebase will be small (a board, a keyboard, a scorer, a corpus loader), which weakens the usual "types pay for themselves at scale" case — but the one algorithm here, the per-letter feedback scorer, is exactly the kind of code where a three-state union (`'exact' | 'present' | 'absent'`) stops a whole class of typo at author time, and its duplicate-letter bug is the failure named in CLAUDE.md's Fifth Directive. Your own fluency matters more than either argument, which is why this is a question and not an assumption.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — TypeScript**: `npm create vue@latest` with TypeScript on. Tile states and game phases become unions the compiler checks, `vue-tsc` joins the verification gate, and editor autocomplete knows the shape of a puzzle. Cost: every file carries annotations, SFCs need `lang="ts"`, and build errors can be type errors rather than real bugs.
- **B — Plain JavaScript**: no type layer. Less ceremony per file, nothing between an idea and a working tile. Cost: the scorer's states are bare strings, so a typo like `'presnt'` is a runtime mystery rather than a red squiggle, and it will be caught by a test or by you, if at all.
- **C — JavaScript with JSDoc types**: plain `.js` files, types in comments, checked via `checkJs`. Most of the safety, none of the syntax change, and removable. Cost: the least-travelled of the three paths — thinner tooling support, and in practice it tends to decay into untyped JS.

**Recommendation**: (by Setter 5, Claude Opus 5, 1M context, 2026-11-12)

**A — TypeScript.** *Rationale*: Three specific things, not a general preference. First, the scorer: its output is a three-state-per-position array, and the duplicate-letter algorithm sketched in [ADR-0001's COD block](0001-answer-corpus-and-guess-validation.md#cod-the-duplicate-letter-trap-the-scorer-must-not-fall-into) is exactly where a union type earns its keep — the compiler will not let a fourth state leak in from a careless branch. Second, the gate: CLAUDE.md's Fifth Directive wants the gate to catch real classes of bug before commit, and `vue-tsc` is a free, fast check that catches a real class, which is a better reason than "TypeScript is good practice." Third, the cost of being wrong is asymmetric — `.ts` → `.js` is deleting annotations, `.js` → `.ts` on a populated codebase is a weekend. I am rejecting C not on merit but on realism: the half-typed JSDoc codebase is a well-attested resting state. *Confidence*: 0.8 — because the scorer-and-gate argument is concrete and the asymmetry is real, but this trades against your fluency, which I cannot see; it sits in the "your call" band on purpose. *If wrong*: if you find yourself fighting type errors instead of writing game logic — if the annotations are where your attention goes in the first week — this flips to **B**, and we strip them rather than live with a toolchain that is taxing the author it was meant to help.

**ANS:** (by Yuxiang Zhou)
A — I'm targeting AI engineering roles where TS is common, so the learning is part of the point. Your flip condition stands: if type errors eat the first week, strip to B.

---

### QST-SITE-URL: Which GitHub Pages URL does this live at?
- Status: answered
- Why asking: Not cosmetics — it sets Vite's `base` option, and getting it wrong is the most likely first production failure here. A **project site** is served from a subdirectory (`https://stanley-zhou.github.io/wordle-with-records/`), so every asset URL needs the `/wordle-with-records/` prefix baked in at build time; with Vite's default `base: '/'` the dev server is flawless and production is a white page with 404s in the console, which is a confusing thing to debug on your first deploy. A **user site** (`https://stanley-zhou.github.io`) is served from the root, so `base` stays default — but it requires a repository literally named `stanley-zhou.github.io`, and you only get one per account, so spending it here means this game is the front door of your GitHub presence. A **custom domain** also serves from root. The answer is one config line; knowing which line is the point of asking.
- Need: pick a letter (or override — any shape answers)

Options:
- **A — Project site**: `https://stanley-zhou.github.io/wordle-with-records/` from this repo as-is. Nothing to rename, no account-level resource spent, and the URL says what it is. Requires `base: '/wordle-with-records/'` in `vite.config.ts` — and the repo can never be renamed without updating it.
- **B — User site**: rename or move the repo to `stanley-zhou.github.io` and serve from the root. Cleanest URL, `base` stays `'/'`, no subdirectory trap. Spends your one account-level user site on this game, and your GitHub landing page becomes a Wordle.
- **C — Custom domain**: a project site with a `CNAME`, served from the root of a domain you own. Nicest result, and `base` stays `'/'`. Costs a domain and DNS setup, and is not free, which is in tension with the stated free-hosting goal.

**Recommendation**: (by Setter 5, Claude Opus 5, 1M context, 2026-11-12)

**A — project site, with `base` set explicitly and the reason written in the config.** *Rationale*: It is free, it is where the repo already is (origin is `github.com/stanley-zhou/wordle-with-records`), and it spends nothing you cannot spend twice — whereas B consumes your single user site on a first project, which is a decision about your GitHub identity rather than about this game. The subdirectory trap is the only real cost, and it is a known, one-line, permanently-fixable cost rather than a risk: `base: '/wordle-with-records/'`, with a comment saying that renaming the repo breaks the deploy. B and C both remain available later, since moving a static site between URLs is a DNS or settings change, not a rebuild. *Confidence*: 0.9 — because the trade is nearly free and fully reversible, and the base-path failure mode is well-understood and verifiable on the first deploy. *If wrong*: if you already own a domain you intend to use, this flips to **C** immediately — it is strictly nicer, `base` stays `'/'`, and the trap disappears entirely.

**ANS:** (by Yuxiang Zhou)
A — I already run another project (pilot-light) as a project site at stanley-zhou.github.io/pilot-light/, so this matches an existing pattern. No custom domain; keep the root user site free.

---

## Supporting Materials

### COD: the one line that decides whether production works
```ts
// vite.config.ts — QST-SITE-URL resolves to exactly this.
export default defineConfig({
  plugins: [vue()],

  // Project site served from a subdirectory. If this is wrong, `npm run dev`
  // is perfect and the deployed page is blank with 404s on every asset —
  // the classic GitHub Pages failure, and the reason QST-SITE-URL is a card.
  // Renaming this repository breaks the deploy until this string changes.
  base: '/wordle-with-records/',
})
```

### COD: how `<style scoped>` delivers what was actually asked for
```vue
<!-- "scoped CSS so styles stay component-local" — compiler-enforced, not a
     naming convention. Vite's SFC compiler rewrites the selector below to
     `.tile[data-v-7ba5bd90]` and stamps the attribute on this component's
     elements only, so `.tile` here cannot reach a `.tile` in any other
     component. This is why the SFC + build step in Explicitation is a
     requirement rather than a preference. -->
<template><div class="tile">A</div></template>

<style scoped>
.tile { /* local to this component, by construction */ }
</style>
```

### FIL: files this ADR creates once answered
- `vite.config.ts` — `base` per QST-SITE-URL
- `.github/workflows/deploy.yml` — the Actions Pages flow named in Explicitation
- `package.json` — the `build` / `test:unit` / `lint` scripts that CLAUDE.md's Fifth Directive promises the gate will run
- `justfile` — the `gate` recipe's marked project slot, filled with those scripts

---

## Decision

### Context
The founding message fixed hosting, framework, and styling. What remains are the choices underneath them that are cheap today and costly later.

### Options
Enumerated per-question above (QST-TYPESCRIPT A–C, QST-SITE-URL A–C). The four toolchain choices in Explicitation are assumptions pending confirmation, not open questions — each is reversible in under a day.

### Chosen: Vue 3 + Vite + TypeScript, deployed by Actions to a Pages project site

Concretely:
1. **TypeScript**, via `npm create vue@latest` with TS on. `vue-tsc` joins the verification gate.
2. **Project site** at `https://stanley-zhou.github.io/wordle-with-records/`, with `base: '/wordle-with-records/'` set explicitly in `vite.config.ts` and a comment saying that renaming the repository breaks the deploy.
3. **The four Explicitation assumptions stand uncontested**: Vite, the official Actions Pages flow rather than a `gh-pages` branch, no router, Vitest.

**Rationale**: Both answers matched the recommendations, and both came with a reason stronger than the one I offered. On TypeScript I argued from the scorer's three-state union and from `vue-tsc` being a free real check for a gate that CLAUDE.md promises will catch real classes of bug — a deliberately narrow case, since the usual "types pay off at scale" argument is weak for a codebase this small. Stanley's reason is better and outranks mine: he is targeting AI-engineering roles where TypeScript is common, so the learning is part of the deliverable, which turns an argument about this codebase into one about his. On the site URL, my case was that a project site is free and spends nothing irreversible while a user site spends the one `stanley-zhou.github.io` on a first project. His answer adds the fact I did not have — he already runs `pilot-light` as a project site — so this is consistency with an established pattern rather than a fresh trade-off, and the root user site stays deliberately free.

**Trade-offs accepted**:
- **Annotations everywhere, and build failures that are sometimes type errors rather than bugs.** The flip condition from the recommendation survives into the answer, in Stanley's own words: if type errors eat the first week, strip to plain JS. Recorded as a live trigger, not a closed option.
- **The repository can never be renamed without changing `base`.** Hence the comment in the config: the failure is a blank production page while the dev server stays perfect.
- **No router**, so deep links to a particular puzzle are not possible. Irrelevant under endless play ([ADR-0002](0002-puzzle-cadence-and-player-records.md)); it would want revisiting if cadence reopens as daily and shareable.

### Consequences
- `vite.config.ts` carries `base: '/wordle-with-records/'` and the warning comment.
- `.github/workflows/deploy.yml` uses `actions/configure-pages` → `actions/upload-pages-artifact` → `actions/deploy-pages`; built output never enters git history.
- `package.json` gains `build`, `test:unit`, `type-check`, and `lint` scripts — and the `gate` recipe's marked project slot is filled **in the same commit that creates them**, so CLAUDE.md's Fifth Directive stops promising checks that do not exist.
- The scorer is typed as a three-state union, which is also where [ADR-0001](0001-answer-corpus-and-guess-validation.md)'s semantic-states-not-colours constraint becomes compiler-enforced rather than a note: a theme maps states to colours, and the scorer cannot return a colour because the type forbids it.
- Pages must be enabled on the repository with source "GitHub Actions" before the first deploy can succeed. Stanley's action, listed below.

---

## Open Follow-ups

- [ ] **Concern — colour alone carries the game's entire feedback channel, and that excludes players.** Green/yellow/grey per letter is the whole output of the scorer, and red-green colour blindness affects roughly 8% of men. Wordle shipped a high-contrast mode (orange/blue) for exactly this reason. The scorer should therefore return *semantic* states (`exact` / `present` / `absent`) and never colours, so a theme can remap them — and a shape or letter-position cue is worth considering alongside. Noted here so the choice is deliberate; it belongs to a presentation ADR, not this one, but the scorer's return type is settled by QST-TYPESCRIPT **now**, so the constraint has to be on the record before implementation.
- [ ] **Future task — fill the `gate` recipe's project slot the same day the first `npm script` exists.** CLAUDE.md's Fifth Directive currently promises checks that do not yet exist. A directive that names an absent gate teaches every future seat that directives are decorative; the promise and the recipe must converge quickly.
- [ ] **Concern, now live — bundle size for the guess dictionary.** QST-GUESS-LEGALITY resolved to **B**, so the ~50–80 KB gzipped asset is confirmed rather than hypothetical. Lazily loaded, never inlined into the main chunk, so the board paints before the dictionary arrives — and under [ADR-0001](0001-answer-corpus-and-guess-validation.md)'s build order it does not exist at all until its licence is recorded, which makes "the game must be playable without it" a hard requirement rather than good practice.
- [ ] **Unverified assumption — GitHub Pages is enabled on this repository.** Needs one visit to Settings → Pages, source "GitHub Actions". Worth confirming before the first deploy rather than debugging it as a failure.
- [ ] **Future task — decide whether `kintsugi adopt` runs here.** `kintsugi.yaml` is present with no lock file and no `kintsugi` CLI installed, so upstream template fixes will never reach this instance. `just gate` treats this as advisory rather than fatal (see the recipe's comment). Stanley's call, not a precondition for shipping code.

---

## Action Items

- [x] Answer QST-TYPESCRIPT — Owner: Stanley — **done 2026-11-12: A, TypeScript**
- [x] Answer QST-SITE-URL — Owner: Stanley — **done 2026-11-12: A, project site**
- [x] Confirm or reject the four Explicitation assumptions — Owner: Stanley — **none contested; all four stand**
- [ ] **Enable GitHub Pages, source "GitHub Actions"** (Settings → Pages) — Owner: Stanley — the one thing I cannot do for you, and the first deploy fails without it
- [ ] Scaffold the app and fill the `gate` recipe's project slot in the same commit — Owner: Setter 5

---

## Validation

- [x] Stanley: the toolchain assumptions are acceptable — none contested
- [x] Stanley: the site URL choice matches what I want this to be — confirmed, consistent with `pilot-light`
- [ ] Setter 5: `base` is set and verified against the real deployed URL, not only against the dev server — **this one cannot be ticked from a green local build**, which is the entire reason it is written as a separate row
- [ ] Setter 5: the scorer returns semantic states, never colours, so the accessibility follow-up stays open rather than foreclosed

**Notes**: The founding message's three specifications — Pages, Vue, scoped CSS — were treated as decided inputs and none was contested. Both answers here came back with reasons that outrank the ones I gave: TypeScript because Stanley is targeting roles where it is expected (a fact about his career, not about this codebase), and the project site because `pilot-light` already establishes the pattern. Worth recording as a pattern in its own right — the recommendation's job was to make accepting cheap, and in both cases the human's *rationale* was better than mine even where the pick was identical.

---

## Iterations

### Iteration 1 (2026-11-12)
- Trigger: Project founding message, which fixed hosting/framework/styling and left the choices underneath them open.
- Contributors: Setter 5 (Claude Opus 5, 1M context)
- Changes: Initial draft. Two questions (typing, site URL); four toolchain choices recorded as reversible assumptions rather than cards, to keep the first answering sitting short.
- Outcome: Status `Draft`; awaiting answers.

### Iteration 2 (2026-11-12)
- Trigger: Stanley answered both questions and left all four Explicitation assumptions uncontested.
- Contributors: Yuxiang Zhou (answers), Setter 5 (Claude Opus 5, 1M context — decision write-up)
- Changes: QST-TYPESCRIPT → `answered` (**A**; his reason — TypeScript is expected in the roles he is targeting, so the learning is part of the point — outranks my scorer-and-gate argument, and his flip condition is recorded live: strip to plain JS if type errors eat the first week). QST-SITE-URL → `answered` (**A**; `pilot-light` already runs as a project site, so this is pattern-consistency, and the root user site stays free). Decision section written. The dictionary bundle-size follow-up promoted from conditional to live now that QST-GUESS-LEGALITY ruled B.
- Outcome: Status `Draft` → `Accepted`. All questions closed; scaffolding unblocked.

---

## Glossary

- **SFC (Single-File Component)**: Vue's `.vue` file — template, script, and style together. The unit that `<style scoped>` scopes to, and the reason a build step is required here.
- **`base`**: Vite's build-time asset path prefix. Must match the subdirectory a Pages project site is served from, or production 404s while development works.
- **Project site vs. user site**: a Pages site served from `/<repo>/` under `<user>.github.io`, versus one served from the root of `<user>.github.io`. One user site per account.

---

## Links

- Related ADRs: [ADR-0001 — answer corpus and guess validation](0001-answer-corpus-and-guess-validation.md) (the dictionary asset's bundle cost; the scorer this ADR types); [ADR-0002 — puzzle cadence and player records](0002-puzzle-cadence-and-player-records.md) (the no-backend consequence that forces a date-seeded puzzle)
- Related code: none yet — this ADR precedes implementation by design

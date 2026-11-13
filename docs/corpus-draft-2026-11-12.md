# Corpus draft — 66 candidates for the ~60-word v1

**Date**: 2026-11-12
**Drafted by**: Setter 5 (Claude Opus 5, 1M context)
**For**: Yuxiang Zhou (Stanley) — strike-a-row review
**Decided by**: [ADR-0001](adr/0001-answer-corpus-and-guess-validation.md) QST-CORPUS-PROVENANCE (**C into A**) and QST-CORPUS-SCALE-60 (**B**)

---

## How to review this

**Delete the rows you don't want.** That's the whole protocol. Whatever survives becomes `src/data/answers.json`; I'll convert it and commit, and the file will cite this draft as its provenance.

66 candidates for a ~60-word target, so there's strike room without me having padded it.

**The calibration check matters as much as the list.** ADR-0001 records my falsifier: if you strike **more than ~20 of 66**, my sense of "a fair CS answer" isn't calibrated to yours, and the process flips — you'd seed the next batch from your own coursework and I'd only format and deduplicate. So don't be gentle to spare the draft. Striking a lot is useful information, not a failure.

**My confidence column is doing real work.** `high` means I'd defend the word to a player who complained. `med` means I can see the argument against it and listed it anyway, usually because it's jargon-specific, an abbreviation, or a verb rather than a noun. The `med` rows are where I expect most of your strikes, and they're deliberately clustered so you can scan them.

Three things I decided *not* to include, so you can overrule me rather than wonder:
- **No plurals.** NODES, EDGES, BYTES, TYPES, PAGES, GATES all fit five letters, but each is a near-duplicate of a word a player already knows, and at 60 words two near-duplicates are 3% of the game. ADR-0001 has this as an open policy question; this draft takes the strict line.
- **No proper nouns.** LINUX, REACT, NGINX are five letters and clearly CS, but they date fast and feel like trivia rather than vocabulary.
- **Nothing needing non-letters.** `O(n)`, `B-TREE`, `2FA`, `UTF-8` are all excluded by the A–Z assumption in ADR-0001.

---

## Data structures and types (10)

| Word | Gloss | Conf |
|---|---|---|
| ARRAY | Contiguous, index-addressed collection | high |
| STACK | Last-in-first-out structure; also the call stack | high |
| QUEUE | First-in-first-out structure | high |
| GRAPH | Vertices joined by edges | high |
| TUPLE | Fixed-length ordered group of values | high |
| FLOAT | Floating-point number | high |
| SLICE | A view over part of a sequence (Go, Python, Rust) | high |
| UNION | Sum type; also the set/SQL operation | high |
| TABLE | Relational table; also a hash table | high |
| INDEX | Position in a sequence; also a database index | high |

## Language and syntax (12)

| Word | Gloss | Conf |
|---|---|---|
| CLASS | Template for objects and their methods | high |
| SCOPE | Region of code where a binding is visible | high |
| MACRO | Expansion performed before or during compilation | high |
| TOKEN | Lexical unit from a tokenizer; also an auth credential | high |
| CONST | Declaration of an immutable binding | high |
| WHILE | Loop that runs while its condition holds | high |
| BREAK | Exit a loop early | high |
| THROW | Raise an exception | high |
| CATCH | Handle a thrown exception | high |
| YIELD | Produce a value from a generator and suspend | high |
| ASYNC | Marks a function that may suspend and resume | high |
| AWAIT | Suspend until an async result is ready | high |

## Compilers and tooling (8)

| Word | Gloss | Conf |
|---|---|---|
| LEXER | Turns source text into tokens | high |
| REGEX | Pattern language for matching text | high |
| TRACE | Record of execution, usually for diagnosis | high |
| DEBUG | Locate and remove a defect | high |
| BUILD | Compile and assemble a deployable artifact | high |
| PARSE | Turn a token stream into structure | med — a verb; PARSER wouldn't fit in five |
| CRATE | A Rust compilation unit and package | med — correct but Rust-only |
| TRAIT | A shared interface a type can implement | med — Rust/Scala/PHP; Java would say interface |

## Memory, concurrency, systems (10)

| Word | Gloss | Conf |
|---|---|---|
| BLOCK | Basic block of code; also a unit of storage | high |
| FRAME | One call's slice of the stack | high |
| CHUNK | A fixed-size piece of a larger stream | high |
| MUTEX | Lock giving one holder at a time | high |
| SPAWN | Start a new process or thread | high |
| INODE | Filesystem record describing a file | high |
| FLUSH | Force buffered data out to its destination | high |
| ALLOC | Reserve memory | med — an abbreviation, not a full word |
| FENCE | Barrier constraining memory-operation ordering | med — real but specialist |
| GUARD | Early-return condition; also a scoped lock | med — two senses, neither dominant |

## Operating system and shell (6)

| Word | Gloss | Conf |
|---|---|---|
| SHELL | Command interpreter | high |
| STDIN | A process's standard input stream | high |
| CACHE | Fast store holding recently used data | high |
| PANIC | Unrecoverable runtime fault (Go, Rust) | high |
| CHMOD | Unix command that changes file permissions | med — a command name |
| MKDIR | Unix command that creates a directory | med — a command name |

## Version control (4)

| Word | Gloss | Conf |
|---|---|---|
| MERGE | Combine divergent histories; also mergesort's step | high |
| CLONE | Copy a repository, or an object | high |
| PATCH | A diff that can be applied | high |
| STASH | Shelve uncommitted changes | med — git-specific |

## Data and databases (7)

| Word | Gloss | Conf |
|---|---|---|
| QUERY | A request for data | high |
| WHERE | SQL clause that filters rows | high |
| GROUP | SQL aggregation clause | high |
| FETCH | Retrieve data; also the instruction-cycle stage | high |
| STORE | Write data; also a state container | high |
| PROXY | Intermediary standing in for another object or server | high |
| SHARD | One horizontal partition of a dataset | med — distributed-systems jargon |

## Theory and maths (6)

| Word | Gloss | Conf |
|---|---|---|
| LOGIC | Formal reasoning; also a circuit's function | high |
| DEPTH | Distance from a tree's root | high |
| DELTA | A difference between two states | high |
| EPOCH | Reference instant for timestamps; also a training pass | high |
| MONAD | Structure for sequencing computations with context | med — functional-programming jargon |
| ARITY | How many arguments a function takes | med — precise but rarely said aloud |

## Hardware and encoding (5)

| Word | Gloss | Conf |
|---|---|---|
| CLOCK | Signal that paces a synchronous circuit | high |
| ASCII | 7-bit character encoding | high |
| CODEC | Encoder/decoder pair | high |
| PIXEL | Smallest addressable picture element | high |
| ADDER | Circuit that sums binary numbers | med — digital-logic specific |

## Machine learning (6)

| Word | Gloss | Conf |
|---|---|---|
| MODEL | Learned function mapping inputs to outputs | high |
| LAYER | One stage of a network; also a protocol layer | high |
| BATCH | Group of examples processed together | high |
| TRAIN | Fit parameters to data | high |
| EMBED | Map a token into a vector space | med — the noun EMBEDDING is what's usually said |
| LOGIT | Pre-softmax score | med — correct, but narrow |

## Control and validity (2)

| Word | Gloss | Conf |
|---|---|---|
| EVENT | Something that happened, delivered to a handler | high |
| STATE | The data a system currently holds | high |

---

## Counts, so the calibration check is arithmetic rather than vibes

- **66 candidates**: 51 `high`, 15 `med`.
- Striking every `med` row leaves **51** — still above a 50-word floor, so you can be ruthless with that column without starving the game.
- **>20 struck total** is the recalibration trigger from ADR-0001. If you land there, say so plainly; the next batch comes from your notes and I format it.

## What happens after you strike

1. I convert the survivors to `src/data/answers.json`, with a header recording that they came from this draft and were ratified by you on a date.
2. The glosses come along in the data file, which makes ADR-0001's deferred "show the definition after the final guess" follow-up nearly free whenever we want it.
3. Growth toward ~300 reuses this exact format. ADR-0001's trigger for the next batch: the first time a play session repeats a word you've already solved.

*Until then `answers.json` ships marked `draft-pending-ratification`, so the game is playable tonight and your review is a prune rather than a blocker.*

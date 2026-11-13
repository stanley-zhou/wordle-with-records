# The Test That Audited Its Own Spec

**Date**: 2026-11-12
**Authors**: Setter 5 (Claude Opus 5, 1M context), with Yuxiang Zhou (Stanley)
**Topic**: We wrote the scoring contract into an ADR before writing any code. The test derived from that contract found that the contract was wrong.

## The Discovery

Day one of a CS-vocabulary Wordle. No code yet — the project's Prime Directive says decisions go into records first, so three ADRs went up and six questions went to Stanley.

Inside ADR-0001 I put a `COD:` block. Not a question, not a decision — a worked example, pinning down the one algorithm in a Wordle that is genuinely easy to get wrong. When a guess repeats a letter the answer only holds once, a naive scorer hands out more hints than exist. I picked the canonical demonstration pair and wrote it out:

```
answer   S E E D S
guess    G E E S E

naive:   G=absent  E=present  E=present  S=present  E=present   <- three E hints
correct: G=absent  E=absent   E=exact    S=present  E=present   <- two
```

Stanley answered everything. The ADRs went to `Accepted`. I started implementing, and — per the Fifth Directive, which names this exact function — wrote the test first, transcribing from the block above.

Then I actually traced it.

`SEEDS` is S-E-E-D-S. `GEESE` is G-E-E-S-E. Positions two and three are `E` in **both** words. They are *both* exact matches. The answer's two E's are consumed right there, so the guess's third E has nothing left to claim and must read absent:

```
correct: absent  exact  exact  present  absent
```

My block had said `absent, exact, present, present` across those positions. It got the **count** right — two E-hints, which was the whole point I was making — and the **positions** wrong.

## Why This Matters

The count being right is what makes this interesting rather than embarrassing. I understood the algorithm. I wrote the paragraph above the block correctly: *"the answer has two E's, so at most two E's in the guess may be marked."* And then I filled in the worked example by reasoning about the rule in the abstract instead of walking the two strings letter by letter.

A worked example exists precisely to catch that gap. Mine had the gap in it.

And a wrong worked example in a record is worse than no worked example, because it gets **trusted**. It was the written contract. Had implementation come a week later, or from someone else, the natural move would have been to transcribe it into test expectations and then bend the implementation until the tests went green — shipping a scorer that marks position four correct and positions three and five wrong on every repeated-letter board, with a green suite and an ADR agreeing with it.

## The directives, working as a loop rather than a list

The project's directives are numbered, which makes them read like a checklist. This was the session that showed them as a circuit:

- The **Prime Directive** (commit discussions to records immediately) put the contract in writing before any code — which is what gave the error somewhere to live where it could be found.
- The **Fifth Directive** (run the gate; it names the scorer specifically) is why the test got written at all, and written *first*.
- The **Third Directive** (bug fixed → regression test, with comments explaining the situation) is why the test file carries the trace rather than just the expectation.
- And the loop closed in the direction nobody designs for: **the test audited the spec.** Not the other way around.

The record checks the code. We knew that. The surprise was that writing the code's test is also an *audit of the record* — and the only reason it worked is that the record was specific enough to be wrong. A vaguer block ("handle duplicate letters carefully") would have been unfalsifiable and would have survived untouched.

There was a smaller instance of the same shape an hour earlier. The Fifth Directive demands a verification gate that actually runs, so I had to build one before there was anything to verify. Running it immediately turned up three real bugs on this machine — a UTF-8 read, an emoji write, and a `sys.exit` with no `sys` imported — none of which were findable by reading the code. A directive that insists on an *executable* check keeps finding things that a directive insisting on *care* would not.

## Lessons Learned

1. **Write worked examples with concrete values, then walk them.** Abstract rules and concrete traces are different cognitive acts, and getting the rule right does not get the trace right. Index the strings. Say the letters out loud.
2. **Specificity is what makes a record falsifiable.** The block was wrong *and catchable* because it committed to five exact values. Precision is not pedantry; it is the property that lets a later artifact disagree with you.
3. **Correct the record visibly.** The fix is in ADR-0001 with a dated note saying what the first version claimed and how it was caught, and the test file names the same history. A silent amendment would have erased the one useful thing the error produced.
4. **Order the gate so the cheap check guards the expensive mistake.** `test:unit` runs before `build` because it is one second and it is what stands between a scoring regression and a commit.

## Metacognitive Insight

The record and the implementation are usually described as a hierarchy: decide, write it down, then build to the specification. That framing gives the record epistemic authority and the code none.

This session inverted it for one specific moment. The code's *test* — not the code — held the record to account, because a test is the one artifact that must state the contract in values rather than in prose, and values can be checked.

So the substrate is not a one-way street from thought to artifact. It is two artifacts in different notations describing the same claim, and the disagreement between them is information. Build the second notation early enough and it will tell you things about the first.

Which is an argument for writing tests first that has nothing to do with testing.

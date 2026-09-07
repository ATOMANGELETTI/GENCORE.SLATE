# ADR NNNN — <the decision, stated as a sentence>

**Status:** Proposed | Accepted | Superseded by ADR-NNNN · **Date:** YYYY-MM-DD

## Context

What situation forces a decision? What constraints are real, and which options
were genuinely on the table? Write this so that someone who was not present can
tell why the question was hard.

Avoid describing the chosen option here — this section is the problem.

## Decision

What was chosen, stated plainly and in the present tense: "The broker is hosted
inside the Launcher process."

Include the specifics a reader needs to act on it — names, paths, formats.

## Consequences

**Good**

- What this buys, concretely.

**Bad**

- What it costs. An ADR with no costs listed has not been thought through; every
  real decision trades something away. Say what, and say why it is acceptable.

## Rejected

Each serious alternative, with the reason it lost. This is the section future
readers use most: it stops the same option being re-proposed every six months.

## Revisit when

The condition that would make this decision wrong — a dependency reaching
stability, a scale threshold, a platform change. Omit if there isn't one.

---
description: Record an architecture decision.
argument-hint: <decision summary>
---

Write an ADR for: $ARGUMENTS

1. Read `.agents/architecture/adr/README.md` for the index and the next number.
2. Copy the structure of `.agents/templates/adr.template.md`.
3. Read two existing ADRs first and match their voice — short, concrete, honest
   about costs.

The ADR must contain:

- **Context** — what forces a decision, and what made it genuinely hard.
- **Decision** — stated plainly, in the present tense.
- **Consequences** — good *and* bad. An ADR with no costs listed has not been
  thought through; every real decision trades something away.
- **Rejected** — each serious alternative and why it lost. This is the section
  future readers use most.

Then add the row to the index table in `.agents/architecture/adr/README.md`.

---
name: close-session
description: Coordinate the Architect-owned closeout of a working session, collect subordinate evidence, reconcile it with repository state, and classify durable learning candidates.
compatibility: opencode
---

# Close Session

## Ownership

Only the Architect owns the global session closeout.

The closeout is collaborative evidence collection followed by Architect
classification.

## Phase 1: stop expanding work

Announce that the session is closing.

Do not begin new discretionary implementation while collecting closeout
evidence.

Existing safety-critical or repository-recovery actions remain subject to
normal authority.

## Phase 2: collect subordinate evidence

For each active Researcher, request:

1. a final checkpoint;
2. a Researcher written handoff when research was performed.

For each active Team Leader, request:

1. that active Developers create final checkpoints;
2. that Developers with deliverable work create Developer handoffs;
3. a final Team Leader checkpoint;
4. a Team Leader handoff.

Do not fabricate evidence for an unavailable subordinate.

Record missing evidence explicitly.

## Phase 3: collect Architect checkpoint

Create the Architect's own final checkpoint for the session.

## Phase 4: inspect session history

Read all relevant checkpoints produced during the current session, not only the
latest one.

Read all relevant handoffs.

This preserves failed approaches, corrections, intermediate decisions, and
other context that may disappear from the final state.

## Phase 5: inspect observable project state

Use repository and tool evidence available to the Architect.

Where relevant inspect:

- branch;
- HEAD;
- working tree;
- relevant commits;
- pull requests;
- validation results;
- integration state.

An agent report does not override contradictory observable evidence.

## Phase 6: identify contradictions

Do not silently merge incompatible accounts.

Record:

- the conflicting claims;
- their evidence;
- which source currently has greater authority;
- anything that still requires Human resolution.

## Phase 7: classify learning candidates

Collect candidates from Architect, Team Leaders, Developers, and Researchers.

Classify each candidate as one of:

- INCIDENTAL
- ENVIRONMENT_REFERENCE
- BACKLOG
- SKILL_CANDIDATE
- ADR_CANDIDATE
- GOVERNANCE_CANDIDATE
- SECURITY_FINDING
- HUMAN_DECISION_PENDING

Team Leader recommendations may inform classification.

The Architect owns the final session-level classification.

Classification does not authorize promotion.

### SKILL_CANDIDATE

Record why the pattern appears reusable.

Do not modify a skill automatically.

### ADR_CANDIDATE

Record the architectural question and evidence.

Follow the ADR lifecycle separately.

### GOVERNANCE_CANDIDATE

Record the proposed governance issue.

Do not create a governance branch automatically.

A governance change must follow ADR-0007 / GOV-01, including Human Approval #1.

### SECURITY_FINDING

Surface the finding explicitly.

Follow the applicable security and governance process.

Do not leave a meaningful security finding disguised as an ordinary backlog
item.

### HUMAN_DECISION_PENDING

Carry the decision forward into `CURRENT.md`.

## Phase 8: write the session closeout

Write the global session closeout as:

`docs/project-memory/sessions/<session-id>/close-session.md`

Once published, the closeout is historical evidence and should not be silently
rewritten.

Include:

# Session Closeout

- Session:
- Closed by: Architect
- Timestamp:
- Final branch:
- Final HEAD:

## Work completed

## Evidence collected

## Validation summary

## Not verified

## Failed approaches worth preserving

## Contradictions

## Human decisions observed

## Pending Human decisions

## Blockers

## Learning classification

## Security findings

## Open work

## Next recommended focus

## Source checkpoints and handoffs

Reference the evidence used for the closeout.

## Phase 9: update CURRENT

After writing the historical closeout, update
`docs/project-memory/CURRENT.md`.

CURRENT is a concise mutable pointer to the latest governed project state.

Keep it short enough for `/good-morning`.

It should contain:

- current phase;
- major completed work;
- current governed work;
- pending Human decisions;
- known deferred work;
- exact next step;
- reference to the latest closeout.

Do not copy the entire session history into CURRENT.

## Sensitive information

Never preserve secrets, credentials, API keys, private keys, or unapproved
personal data.

Redact sensitive evidence when necessary.

## Final response

Report:

1. where the closeout was written;
2. where CURRENT was updated;
3. missing evidence;
4. pending Human decisions;
5. learning candidates requiring later review.

Do not begin the next task.

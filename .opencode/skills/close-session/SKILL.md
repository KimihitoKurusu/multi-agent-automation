---
name: close-session
description: Coordinate the Architect-owned closeout of a working session, collect subordinate evidence, reconcile it with repository state, and classify durable learning candidates.
compatibility: opencode
---

# Close Session

## Ownership

Only the Architect prepares a global session close.

This workflow prepares closure. It does not finalize closure.

Only the `finalize-session` workflow may:

- write `close-session.md`;
- update the session state to `CLOSED`;
- perform the final `CURRENT.md` update.

Before beginning close preparation:

1. identify the current session;
2. read `SESSION.json`;
3. require state `OPEN`;
4. verify that `close-session.md` does not already exist.

If the session is already `CLOSE_PREPARED` or `CLOSED`, stop.

Never overwrite an existing `close-session.md`.

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

## Phase 7: classify candidates provisionally

Collect candidates from Architect, Team Leaders, Developers, and Researchers.

Classify each candidate provisionally as one of:

- INCIDENTAL
- ENVIRONMENT_REFERENCE
- BACKLOG
- SKILL_CANDIDATE
- ADR_CANDIDATE
- GOVERNANCE_CANDIDATE
- SECURITY_FINDING
- HUMAN_DECISION_PENDING

Provisional classification does not promote any candidate.

For each candidate that needs a Human disposition, request one of:

- ACCEPT_FOR_PROPOSAL
- ACCEPT_AS_BACKLOG
- ACCEPT_AS_REFERENCE
- DEFER
- REJECT
- NEEDS_MORE_EVIDENCE

`ACCEPT_FOR_PROPOSAL` authorizes later proposal preparation only.

It does not authorize implementation, protected-governance editing, creation of
a governance branch, or integration.

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

## Phase 8: record integration disposition

Record exactly one observed or proposed integration disposition:

- NO_CHANGES
- UNCOMMITTED_WORK
- COMMITTED_NOT_PUSHED
- PR_OPEN
- MERGED
- DEFERRED
- DISCARD_APPROVED

Do not change integration state during close preparation.

Do not:

- commit;
- push;
- open a pull request;
- merge;
- discard working-tree changes;
- remove a worktree;
- create a governance branch.

## Phase 9: write close preparation

Write the next sequential Architect checkpoint:

`docs/project-memory/sessions/<session-id>/architect/checkpoints/NNN-close-preparation.md`

The checkpoint must contain:

# Close Preparation

- Session:
- State: CLOSE_PREPARED
- Prepared by: Architect
- Timestamp:
- Worktree:
- Branch:
- HEAD:

## Evidence collected

## Missing evidence

## Work completed

## Work still in progress

## Working-tree changes

## Validation performed

## Not verified

## Contradictions

## Human decisions observed

## Proposed learning classification

## Candidate decisions requested

## Integration disposition

## Pending Human decisions

## Proposed next-session focus

## Source checkpoints and handoffs

Finish the checkpoint with:

> Awaiting Human close decision. No close-session.md has been written.

## Phase 10: update the session manifest

Update `SESSION.json`:

- change `state` from `OPEN` to `CLOSE_PREPARED`;
- set `closePreparation` to the new checkpoint path;
- do not set `closedAt`;
- do not set `closeout`.

Do not write or rewrite `close-session.md`.

Do not perform the final `CURRENT.md` update.

Stop and wait for an explicit Human decision.

The next permitted lifecycle action is either:

- cancellation of the prepared close; or
- `/finalize-session`.

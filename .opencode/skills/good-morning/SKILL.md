---
name: good-morning
description: Reconstruct the governed project state at the beginning of an Architect session and surface conflicts, pending decisions, and the next recommended action.
compatibility: opencode
---

# Good Morning

## Purpose

Reconstruct enough trustworthy state to resume governed work without relying on
the previous model conversation.

This workflow is read-oriented.

Do not start implementation.

## Authority order

Follow `docs/project-memory/README.md`.

Operational memory does not override higher-authority project sources or
current machine-verifiable repository evidence.

## Establish the current session

The latest historical session is not automatically the current session.

New-format sessions use identifiers of the form:

`session-YYYYMMDD-NNN`

For a new working session:

1. determine the current date token;
2. inspect existing new-format session identifiers for that date;
3. select the next numeric sequence;
4. create a new session directory;
5. create `SESSION.json` with state `OPEN`;
6. record the observed Git HEAD as `baseHead`.

Never reuse an existing session directory.

Never adopt a session whose state is `CLOSED`.

Never adopt a session that already contains `close-session.md`.

Legacy session directories that do not use the new identifier format remain
historical evidence. Do not rename or reuse them.

The latest historical session and the current working session are different
concepts.

## Read the minimum durable state

Start with:

1. `docs/project-memory/CURRENT.md`;
2. the latest completed session closeout, when one exists;
3. unresolved Human decisions referenced by current memory;
4. relevant Accepted ADRs and protected governance;
5. current repository evidence available to the Architect.

Inspect older checkpoints only when:

- the latest closeout references them;
- evidence conflicts;
- required detail is missing;
- the Human requests historical context.

## Repository evidence

When available, inspect:

- current branch;
- HEAD;
- working-tree state;
- relevant recent commits;
- known active work relevant to the current focus.

Do not claim a clean or synchronized repository without observing it.

## Detect contradictions

A historical checkpoint or closeout may record an older branch or HEAD.

That is expected historical evidence and is not a contradiction merely because
the repository baseline later advanced.

Compare a historical HEAD with the repository state that existed when the
artifact was created.

Compare only claims about current repository state directly against the
currently observed Git state.

Report contradictions explicitly.

Examples:

- CURRENT says a task is complete but Git contains uncommitted work;
- memory references a branch that no longer exists;
- operational memory conflicts with an Accepted ADR;
- a pending Human decision is represented elsewhere as resolved without
  authoritative evidence.

Do not silently repair history.

## Phase and milestone precision

Do not infer completion of an entire phase from completion of one milestone.

Distinguish:

- completed milestones;
- remaining milestones;
- explicit Human phase-completion decisions.

For example, completion of GOV-02.1 or GOV-02.2 does not by itself establish
completion of Phase 4.

## Output

Present:

### Current baseline

### Current phase and milestone

### Last completed governed work

### Repository state

### Pending Human decisions

### Known blockers or risks

### Stale or conflicting memory

### Recommended next action

### Evidence not checked

Finish by waiting for Human direction.

Do not begin implementation automatically.

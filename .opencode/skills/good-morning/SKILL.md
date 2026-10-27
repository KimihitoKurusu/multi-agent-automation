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

Report contradictions explicitly.

Examples:

- CURRENT says a task is complete but Git contains uncommitted work;
- memory references a branch that no longer exists;
- operational memory conflicts with an Accepted ADR;
- a pending Human decision is represented elsewhere as resolved without
  authoritative evidence.

Do not silently repair history.

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

---
name: checkpoint
description: Capture an append-only, evidence-based checkpoint so the current actor can resume work after interruption or context loss.
compatibility: opencode
---

# Checkpoint

## Purpose

Preserve the current actor's work state without relying on transient model
context.

A checkpoint records evidence. It does not grant authority, approve work, or
change project governance.

## Authority

Follow `docs/project-memory/README.md`.

Higher-authority project sources override operational memory.

Write only inside the current actor's session namespace.

Do not modify an existing checkpoint after it has been published.

## Session lifecycle precondition

Before writing a checkpoint:

1. identify the current session;
2. read its `SESSION.json`;
3. verify that the session state is `OPEN`;
4. verify that `close-session.md` does not exist.

If the session is `CLOSE_PREPARED` or `CLOSED`, do not write a checkpoint.

If no valid current `OPEN` session exists, stop and request establishment of a
new session.

Never adopt the latest historical session identifier merely because it is the
most recent directory.

A session containing `close-session.md` is historical and immutable.

## Determine the target

Use the current session identifier and actor identity supplied by the active
workflow.

Write the next sequential checkpoint under the actor's own `checkpoints/`
directory.

Use a filename such as:

`NNN-<short-kebab-summary>.md`

Do not guess another actor's identity or write into another actor's namespace.

If the session or actor identifier is missing and cannot be established from
the active workflow, report the missing information rather than choosing an
identity silently.

## Evidence collection

Record observable evidence available to the current role.

When authorized tools are available, inspect relevant repository state such
as:

- current branch;
- current Git HEAD;
- working-tree state;
- relevant validation results.

Do not bypass a role restriction merely to make the checkpoint fields
complete.

If a role cannot obtain some evidence, record the field as unavailable or
unverified.

Never represent inferred repository state as observed evidence.

## Required checkpoint

Write:

# Checkpoint: <summary>

- Session:
- Actor role:
- Actor id:
- Timestamp:
- Branch:
- HEAD:

## Assignment

The bounded work currently assigned to this actor.

## Completed

Work actually completed since the previous checkpoint.

## Verified

Claims for which evidence was actually observed.

Include the command, tool result, path, commit, or other evidence when useful.

## Not verified

Relevant claims that have not been verified.

Never omit this section merely because no validation was run.

## Current working-tree state

Describe observed state.

If inaccessible to this role, state that explicitly.

## Failed attempts

Record failures that materially affect continuation.

Do not log every harmless typo or irrelevant command.

## Decisions observed

Record relevant decisions without giving them more authority than their source.

## Human decisions observed

Record relevant Human decisions as observations.

A checkpoint is not proof that another actor may exercise Human authority.

## Blockers

Current blockers, if any.

## Pending work

Work still required within the assignment.

## Next exact step

The most precise useful continuation point.

## Learning candidates

Record potential reusable lessons without promoting them.

Use one of these provisional labels when appropriate:

- INCIDENTAL
- ENVIRONMENT_REFERENCE
- BACKLOG
- SKILL_CANDIDATE
- ADR_CANDIDATE
- GOVERNANCE_CANDIDATE
- SECURITY_FINDING
- HUMAN_DECISION_PENDING

Classification may be refined during session close.

## Sensitive information

Never store secrets, authentication credentials, private keys, API keys, or
unapproved personal data.

Reference sensitive evidence without copying its sensitive value.

## Historical immutability

Do not append checkpoints to a closed session.

Human corrections received after closure belong to a newly allocated session,
not to the closed session.

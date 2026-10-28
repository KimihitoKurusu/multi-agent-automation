---
name: finalize-session
description: Finalize a prepared operational-memory session after an explicit Human close decision, writing the immutable closeout exactly once.
compatibility: opencode
---

# Finalize Session

## Purpose

Finalize a session whose close preparation has already been completed and
reviewed by the Human.

This workflow writes the immutable session closeout exactly once.

It does not commit, push, open a pull request, merge changes, remove a
worktree, or implement accepted governance candidates.

## Preconditions

Before making any change, verify all of the following:

1. the current session has a valid `SESSION.json`;
2. the session state is `CLOSE_PREPARED`;
3. the referenced close-preparation checkpoint exists;
4. `close-session.md` does not already exist;
5. an explicit Human close decision was received after close preparation.

If any condition is not satisfied, stop without writing the closeout.

## Human close decisions

Recognize only:

- `CONFIRM_CLOSE`
- `CLOSE_WITH_PENDING_ITEMS`
- `CANCEL_CLOSE`

`CANCEL_CLOSE` reopens the session for work and does not create
`close-session.md`.

Do not infer confirmation from silence, an earlier implementation approval, an
agent statement, or the mere invocation of this skill.

## Candidate dispositions

Record the Human disposition for each candidate using one of:

- `ACCEPT_FOR_PROPOSAL`
- `ACCEPT_AS_BACKLOG`
- `ACCEPT_AS_REFERENCE`
- `DEFER`
- `REJECT`
- `NEEDS_MORE_EVIDENCE`

`ACCEPT_FOR_PROPOSAL` authorizes later proposal preparation only.

It does not authorize governance implementation, creation of a governance
branch, or modification of protected governance.

## Integration disposition

Record one integration disposition:

- `NO_CHANGES`
- `UNCOMMITTED_WORK`
- `COMMITTED_NOT_PUSHED`
- `PR_OPEN`
- `MERGED`
- `DEFERRED`
- `DISCARD_APPROVED`

This workflow records integration state. It does not automatically change that
state.

Do not commit, push, open a pull request, merge, remove a worktree, or discard
changes while finalizing the session.

## Final closeout

When the Human confirms closure, write:

`docs/project-memory/sessions/<session-id>/close-session.md`

The closeout must include:

- session identifier;
- closing timestamp;
- final observed worktree, branch, and HEAD;
- evidence collected during close preparation;
- missing and unverified evidence;
- work completed;
- work still pending;
- Human decisions;
- candidate dispositions;
- integration disposition;
- unresolved items;
- security findings;
- next recommended focus;
- references to source checkpoints and handoffs.

Historical HEAD values remain valid evidence of the repository state at the
time their artifacts were created.

Do not classify an older historical HEAD as stale merely because the current
baseline later advanced.

## Final session state

After writing the closeout:

1. update `SESSION.json` to state `CLOSED`;
2. record `closedAt`;
3. record `closeout` as `close-session.md`;
4. update `docs/project-memory/CURRENT.md`;
5. stop.

Do not infer that Phase 4 is complete merely because one Phase 4 milestone is
complete.

After the session reaches `CLOSED`:

- do not add checkpoints;
- do not add handoffs;
- do not rewrite the close preparation;
- do not rewrite `close-session.md`;
- do not append later Human corrections to the closed session.

Later evidence belongs to a newly allocated session.

## Sensitive information

Do not store secrets, credentials, API keys, private keys, or unapproved
personal data.

---
name: dev-written-handoff
description: Produce the evidence-based Developer delivery submitted to a Team Leader after completing or blocking a bounded implementation task.
compatibility: opencode
---

# Developer Written Handoff

## Purpose

Transfer a bounded Developer task to its Team Leader with enough evidence for
independent review.

A handoff is not approval for integration.

## Preconditions

Identify:

- task or assignment;
- receiving Team Leader;
- current branch;
- delivered HEAD when available.

Do not broaden the task while producing the handoff.

## Evidence

Use only validations actually executed.

A statement such as `tests pass` requires observed test evidence.

Distinguish execution evidence from conclusions based only on code inspection.

## Output

Write the handoff inside the current Developer's session `handoffs/`
directory.

Use an append-only filename.

The handoff must contain:

# Developer Handoff: <task>

- Session:
- Developer:
- Receiver:
- Branch:
- HEAD:

## Assignment

## Requirements covered

## Files changed

Use repository-relative paths.

## Tests created or changed

## Validations executed

For each validation include:

- command or tool;
- result;
- relevant exit status when available.

## Not verified

## Known limitations

## Deviations from assignment

Use `None` when there were no deviations.

## Suggested review focus

Identify areas where independent review is especially valuable.

## Pending work

## Learning candidates

## Sensitive information

Do not include secrets, credentials, private keys, API keys, or unapproved
personal data.

## Authority

The Team Leader must independently review the delivery.

This handoff does not authorize integration into `test` or `main`.

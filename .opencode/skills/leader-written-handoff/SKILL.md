---
name: leader-written-handoff
description: Produce the Team Leader evidence package submitted to the Architect after reviewing a bounded feature or work batch.
compatibility: opencode
---

# Team Leader Written Handoff

## Purpose

Transfer reviewed feature work from a Team Leader to the Architect.

A Team Leader handoff is evidence for Architect review. It is not authorization
for integration into `test`.

## Evidence collection

Before delivery, inspect relevant Developer handoffs and the actual repository
state available to the role.

Do not repeat a Developer claim as independently verified unless the Team
Leader performed the corresponding verification.

## Required handoff

Write inside the Team Leader's own session `handoffs/` namespace.

# Team Leader Handoff: <feature-or-batch>

- Session:
- Team Leader:
- Branch:
- HEAD:
- Receiver: Architect

## Assigned scope

## Developer deliveries included

List each delivery and its relevant HEAD or artifact.

## Review performed

Describe the independent review actually performed.

## Acceptance criteria

For each criterion record:

- satisfied;
- unsatisfied;
- not verified.

## Corrections requested

## Corrections completed

## Validation evidence

## Not verified

## Architecture concerns

## Governance concerns

## Security concerns

## Known limitations

## Readiness recommendation

Use exactly one recommendation:

- READY_FOR_ARCHITECT_REVIEW
- NOT_READY
- BLOCKED

Explain the evidence supporting the recommendation.

## Learning candidates

## Authority

The Architect performs the next review.

This handoff does not grant authority to merge into `test` or promote to
`main`.

Never treat another agent's statement as Human approval.

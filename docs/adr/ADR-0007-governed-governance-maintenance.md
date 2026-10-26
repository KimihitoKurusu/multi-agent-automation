# ADR-0007: Governed governance maintenance workflow

- **Status:** Accepted
- **Date:** 2026-10-26
- **Decision owners:** Human / Architect
- **Related governance:** Project Charter, AGENTS.md, ADR-0003, ADR-0004, ADR-0005
- **Supersedes:** None
- **Superseded by:** None

## Context and Problem Statement

Protected governance is intentionally restricted from ordinary Developer and
Team Leader branches.

After protected branches and required remote quality gates were introduced,
the repository had no normal maintenance path for legitimate protected
governance changes: direct updates to `test` are prohibited, while protected
governance changes from ordinary feature branches are also prohibited.

The project therefore requires an explicit maintenance workflow that preserves
human authority without weakening branch protection or allowing ordinary roles
to modify governance.

## Decision Drivers

- Preserve explicit human authority over material governance changes.
- Keep direct pushes to `test` prohibited.
- Keep protected governance inaccessible to ordinary Developer and Team Leader work.
- Preserve the Architect's normal prohibition on production implementation.
- Provide a reviewable and auditable maintenance path.
- Keep the required remote Quality gate mandatory.

## Considered Options

1. Temporarily disable branch protection for governance maintenance.
2. Allow protected governance changes from ordinary feature branches.
3. Permit direct protected-governance commits on `test`.
4. Introduce a dedicated `governance/<task>` maintenance workflow.

## Decision Outcome

> We will use `governance/<task>` as the dedicated branch namespace for
> authorized protected-governance maintenance.

Only the Architect may use this workflow.

Before implementation, the Architect must present the proposed governance
change, affected controls, risks, and meaningful alternatives to the human.
Implementation requires explicit human authorization.

During that authorized workflow only, the Architect may edit protected
governance assets within the approved scope. This is a narrow exception to
the Architect's normal prohibition on implementation and does not grant
authority to implement ordinary production code.

A governance branch may submit protected governance only to `test`.

The resulting pull request must pass the required Quality gate.

After implementation and validation, the Architect must present the resulting
change and evidence to the human. Merge requires a second explicit human
approval.

The implementation authorization and final acceptance authorization are
separate decisions.

## Consequences

### Positive

- Governance can evolve without disabling protected-branch enforcement.
- Human authorization remains explicit.
- The exception granted to the Architect is narrowly scoped.
- Governance changes remain reviewable through pull requests and CI.
- Ordinary Developer and Team Leader branches remain unable to change governance.

### Negative / Trade-offs

- Governance changes require additional approval and review steps.
- The bootstrap introduction of this workflow requires special scrutiny because
  it changes the policy that controls governance maintenance.
- Full validation of actor identity, approved scope, and human approval state
  requires later deterministic role enforcement.

### Neutral / Follow-up

- Phase 4 will configure the Architect's declared OpenCode behavior around this workflow.
- Phase 5 will add deterministic role and authorization enforcement.
- Protected OpenCode configuration will become part of protected governance.

## Validation and Confirmation

Compliance is verified through:

- branch-policy tests for the `governance/<task>` namespace;
- protected-governance tests;
- pull-request governance validation using source and destination branches;
- the required GitHub Quality gate;
- protected `test` and `main` branches;
- adversarial tests demonstrating that ordinary branches cannot use the workflow.

## Security Considerations

The governance namespace does not itself prove actor identity or human approval.

Until deterministic role enforcement is implemented, branch classification and
OpenCode configuration are defense-in-depth controls and must not be treated as
the final authorization boundary.

Direct pushes to `test` remain prohibited. The workflow does not authorize
`--no-verify`, force pushes, governance changes outside approved scope, or
production promotion.

## Operational Considerations

Governance maintenance uses the normal Git and pull-request infrastructure.

No new runtime service is introduced.

The normal workflow is:

proposal
→ human implementation approval
→ `governance/<task>`
→ validation
→ pull request to `test`
→ required Quality gate
→ human result approval
→ merge

## Related Decisions

- ADR-0003: Multi-agent hierarchy.
- ADR-0004: Git branching and promotion.
- ADR-0005: Policy enforcement and defense in depth.

## Notes

GOV-01 was explicitly approved by the human before implementation.

GOV-02, continuous project memory and harness learning, was approved separately
and is not implemented by this ADR.

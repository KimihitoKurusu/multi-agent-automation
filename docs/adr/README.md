# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for the Multi-Agent Automation Platform.

An ADR captures one architecturally significant decision together with the context that motivated it, the alternatives that were considered, the chosen decision, and its consequences.

ADRs preserve architectural memory. They are not substitutes for the Project Charter, agent governance, security policy, contribution rules, or implementation documentation.

## Authority

ADRs operate under the project governance defined by:

1. `docs/architecture/PROJECT_CHARTER.md`
2. explicit authorized human decisions
3. the ADR lifecycle and review rules described here

An accepted ADR is authoritative for the architectural decision it records until it is superseded or otherwise changed through the governed ADR process.

An ADR cannot grant an agent permissions that conflict with higher-level project governance.

## Location

All project ADRs live in:

```text
docs/adr/
```

The reusable authoring template is:

```text
docs/adr/ADR-TEMPLATE.md
```

## Naming Convention

Accepted numbering uses four digits followed by a lowercase kebab-case title:

```text
ADR-0001-primary-language-and-runtime.md
ADR-0002-monorepo-and-package-management.md
ADR-0003-multi-agent-hierarchy.md
```

Rules:

- ADR numbers are sequential.
- A number is never reused for a different decision.
- File names remain stable after acceptance unless a repository-wide migration is explicitly approved.
- The numeric identifier is the durable identity of the decision.

## When an ADR Is Required

Create an ADR for a decision that materially affects one or more of the following:

- system structure,
- component boundaries,
- runtime or primary implementation language,
- persistent data architecture,
- dependency direction,
- public contracts,
- security boundaries,
- authorization or governance mechanisms,
- communication patterns,
- browser-control architecture,
- deployment architecture,
- major infrastructure choices,
- testing architecture,
- significant cross-cutting technology choices.

An ADR is generally not required for:

- routine bug fixes,
- local implementation details that do not establish a lasting architectural constraint,
- formatting changes,
- ordinary dependency patch updates that do not change architectural behavior,
- documentation corrections that do not change policy or architecture.

When uncertain, the Architect determines whether a decision is architecturally significant enough to require an ADR, subject to higher-level governance.

## ADR Statuses

This project uses the following ADR statuses:

### Proposed

The decision is under review and is not yet an accepted architectural constraint.

Implementation may explore the proposal when explicitly authorized, but a Proposed ADR must not be represented as an Accepted project decision.

### Accepted

The decision has completed the required governance process and is currently authoritative within its scope.

### Rejected

The proposal was considered and intentionally not adopted.

The record is retained so the project does not lose the reasoning that led to rejection.

### Deprecated

The decision is no longer preferred for new work, but it has not necessarily been replaced by one specific ADR.

The ADR must explain why it was deprecated and what guidance applies to future work.

### Superseded

A later ADR replaced the decision.

The superseded ADR must identify its replacement.

The replacement ADR must identify the decision it supersedes.

## Initial ADR Lifecycle

The normal lifecycle is:

```text
Proposed
   |
   +--> Accepted
   |
   +--> Rejected

Accepted
   |
   +--> Deprecated
   |
   +--> Superseded by a later ADR
```

Status changes must be deliberate and reviewable.

## Do Not Rewrite Architectural History

After an ADR is Accepted, preserve the historical decision and its original rationale.

Minor corrections that do not alter meaning may be made through the normal governed review process.

If the architectural decision materially changes, do not rewrite the old ADR as though the new decision had always existed.

Instead:

1. create a new ADR,
2. describe the new context,
3. record the new decision,
4. mark the previous ADR as Superseded when applicable,
5. cross-reference both records.

Rejected, Deprecated, and Superseded ADRs remain in the repository.

## Required Sections

Every ADR based on the project template must contain:

```text
Title / identifier
Status
Date
Decision owners
Related governance
Context and problem statement
Decision drivers
Considered options
Decision outcome
Consequences
Validation / confirmation
Security considerations
Operational considerations
Related decisions
Notes
```

A section may state `Not applicable` when that is genuinely correct, but required sections should not be silently removed.

## Decision Outcome Style

The decision outcome must be explicit and testable where practical.

Prefer active statements such as:

```text
We will use TypeScript as the primary implementation language.
```

Avoid vague statements such as:

```text
TypeScript seems like a good option.
```

An ADR should make it possible for a future contributor or agent to determine whether an implementation conforms to the decision.

## Context and Alternatives

The Context section should explain the forces that made the decision necessary.

The Considered Options section should record meaningful alternatives, not fabricated alternatives added only to fill the template.

When only one viable option existed because of a higher-level constraint, document that constraint explicitly.

## Consequences

ADRs must record meaningful trade-offs.

Consequences should include positive and negative effects where they exist.

Do not present an architectural decision as cost-free merely because it was accepted.

Consequences may include:

- implementation complexity,
- operational burden,
- security implications,
- performance implications,
- developer experience,
- testing impact,
- migration requirements,
- future constraints,
- follow-up decisions.

## Validation and Confirmation

Where practical, describe how the project can verify continuing compliance with the ADR.

Examples may include:

- automated architecture tests,
- configuration validation,
- repository policy,
- package dependency checks,
- security tests,
- integration tests,
- code review criteria.

Not every ADR can be fully enforced automatically, but deterministic confirmation is preferred when practical.

## Security Considerations

Every ADR must explicitly consider security impact.

This does not mean every ADR introduces a security risk. When no meaningful additional security impact exists, state that conclusion and why.

Security-sensitive decisions must remain consistent with `SECURITY.md`.

## Operational Considerations

ADRs must consider operational consequences where applicable, including:

- deployment,
- observability,
- failure recovery,
- resource usage,
- local development,
- external dependencies,
- migration or rollback.

## Decision Owners

The `Decision owners` field identifies the authority responsible for accepting the decision under the current governance model.

During the project's current bootstrap phase, material architecture decisions are being established with explicit human participation.

Once the governed multi-agent harness is operational, the Architect will manage architecture decisions within the authority boundaries defined by the Project Charter, `AGENTS.md`, and Human Gate requirements.

## Human Approval

An ADR cannot be used to bypass a requirement for explicit human approval.

When the Project Charter, `SECURITY.md`, or another higher-level governance rule requires human approval, the ADR must remain Proposed until that approval is obtained and recorded through the applicable process.

## Relationship to Agent Work

Agents must inspect relevant Accepted ADRs before making architecture-affecting changes.

A Developer must not silently violate an Accepted ADR to complete a task.

A Team Leader who discovers that an Accepted ADR prevents legitimate implementation must escalate the conflict to the Architect.

The Architect may propose a new ADR or another governed resolution.

## Relationship to Pull Requests and Reviews

When a change implements or materially depends on an ADR, the review evidence should reference the ADR identifier where practical.

A code change and an ADR do not necessarily need to be in the same commit, but the decision must be Accepted before implementation is treated as establishing the new architectural baseline unless an explicitly authorized exploration is being performed.

## Index

The decision log begins with the following planned baseline records:

| ADR | Decision | Status |
| --- | --- | --- |
| ADR-0001 | Primary language and runtime | Accepted |
| ADR-0002 | Monorepo and package management | Accepted |
| ADR-0003 | Multi-agent hierarchy | Accepted |
| ADR-0004 | Git branching and promotion | Accepted |
| ADR-0005 | Policy enforcement and defense in depth | Accepted |
| ADR-0006 | Shared browser control | Accepted |

`Planned` in this index means the ADR file has not yet completed creation and acceptance. `Planned` is not an ADR document status.

When an ADR file is created, update this index to reflect its actual status.

## Template Use

To create a new ADR:

1. copy `ADR-TEMPLATE.md`,
2. assign the next unused sequential number,
3. replace every template placeholder,
4. remove template-only guidance that is not part of the completed record,
5. set the initial document status to `Proposed`,
6. complete the required review and approval process,
7. change the status to `Accepted` only when the necessary authority has approved the decision,
8. update the index in this file.

A model must not mark its own proposal as Accepted merely because it generated the ADR.

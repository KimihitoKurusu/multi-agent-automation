# ADR-0005: Policy Enforcement and Defense in Depth

- **Status:** Accepted
- **Date:** 2026-10-21
- **Decision owners:** Human project owner during bootstrap governance
- **Related governance:** `docs/architecture/PROJECT_CHARTER.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ADR-0003`, `ADR-0004`
- **Supersedes:** None
- **Superseded by:** None

## Context and Problem Statement

The platform gives AI agents access to development tools and will later give governed workflows access to Git mutations, MCP capabilities, browser actions, persistent state, and human approval gates.

Prompt instructions alone cannot serve as a reliable authorization boundary. A model may misunderstand instructions, hallucinate state, be influenced by untrusted content, or attempt to use a broader tool to reproduce an operation that a narrower tool correctly denied.

OpenCode provides native tool permissions and a plugin system that can participate in enforcement, but project authority also depends on business state that extends beyond any one OpenCode session: agent identity, role, task scope, branch ownership, workflow state, review state, required validation, human approvals, browser-control leases, and production-promotion constraints.

The project therefore needs an architectural policy for where rules live, how they are evaluated, how failures behave, and how overlapping controls reinforce rather than contradict one another.

This decision defines the security and governance boundary used by OpenCode configuration, plugins/hooks, the Policy Engine, Orchestrator, Git Controller, Human Gate, browser tooling, Git hooks, CI, remote branch protection, and audit logging.

## Decision Drivers

- Prevent prompts from being treated as security boundaries.
- Enforce role restrictions even when a model attempts a prohibited action.
- Keep authorization consistent across OpenCode, Git, browser, MCP, and future actions.
- Prevent a general-purpose interface from bypassing a denied specialized capability.
- Require explicit human authority where project governance demands it.
- Fail closed when mandatory authorization or validation cannot be determined.
- Preserve auditable evidence of important policy decisions.
- Protect governance files and quality gates from unauthorized weakening.
- Reinforce local controls with CI and remote protections where practical.

## Considered Options

### Option A: Prompt-only governance

Encode restrictions only in agent prompts and rely on model compliance.

### Option B: OpenCode permissions/plugins as the complete enforcement boundary

Use OpenCode permissions and plugins as the sole mechanism for project authorization.

### Option C: Central Policy Engine only

Use a Policy Engine as the sole meaningful control for protected operations.

### Option D: Defense in depth with centralized policy semantics and multiple enforcement points

Use project policy as the authoritative semantic layer and reinforce it through OpenCode permissions/plugins, narrow controllers, Git hooks, quality gates, CI, protected branches, Human Gate, and service boundaries.

## Decision Outcome

> We will implement policy enforcement using defense in depth. Critical authorization rules will be represented in deterministic project logic and reinforced at multiple execution layers. Prompts guide models but are not security boundaries.

The governing principle remains:

```text
Model proposes
      |
      v
Harness / Policy evaluates
      |
      +--> DENY
      +--> REQUIRE APPROVAL
      +--> ALLOW
                |
                v
      deterministic controller/tool
                |
                v
              action
```

### Policy Engine

The Policy Engine will become the central project-level evaluator for business authorization decisions that require project state.

A policy decision should be capable of considering, as applicable:

```text
actor identity
actor role
session
feature/task scope
requested capability
resource
governed branch
workflow state
review state
validation evidence
human approval state
browser-control lease
security classification
```

The final API is an implementation decision. This ADR defines responsibility, not a function signature.

### Policy outcomes

The policy model must support at least:

```text
ALLOW
DENY
REQUIRE_APPROVAL
```

Ambiguous or unavailable mandatory authorization must not silently become `ALLOW`.

### OpenCode permissions

OpenCode permissions are an early development-harness enforcement layer for tool availability and approval behavior. OpenCode documents permission outcomes equivalent to allow, ask, and deny.

Agent profiles must use explicit permissions rather than depending only on prompts.

Intended direction:

```text
Architect:
  read/search/review -> allowed as required
  ordinary production-code edit -> denied

Team Leader:
  read/search/review -> allowed as required
  ordinary production-code edit -> denied

Developer:
  implementation edit -> bounded by authorized task scope
  protected integration -> denied

Researcher:
  read/research -> allowed as required
  implementation edit -> denied
```

Exact OpenCode syntax and tool names must be verified against the installed OpenCode version before implementation.

### OpenCode plugins/hooks

Project-local OpenCode plugins may participate in role enforcement, branch guards, protected-file checks, command guards, audit events, and calls into project policy services when supported by the installed version.

Plugins are enforcement adapters, not the sole owner of project authorization semantics.

### Narrow controllers

Sensitive state-changing capabilities should be exposed through narrow deterministic controllers rather than unrestricted shell commands whenever practical.

Examples include:

```text
Git Controller
Human Gate
Browser Controller
Job Controller
```

A controller with elevated technical capability must validate authorization before performing an operation.

### Capability-based authorization

Policy governs semantic effects, not only tool names.

If a Developer is denied integration into `test`, the Developer must not reproduce the same protected effect through `bash`, another Git wrapper, or a newly exposed MCP tool.

### Git hooks and quality gates

Repository hooks will enforce fast local invariants such as branch policy, protected files, formatting, linting, type checking, selected tests, secret checks, and commit-message rules as these controls are implemented.

Hooks are not the sole authorization layer.

### CI and remote protection

CI and remote branch protections will reinforce repository integrity independently of local agent behavior.

Expected protections include required checks and restrictions on protected branches such as `test` and `main` where supported.

### Human Gate

Actions requiring explicit human authority must enter a governed waiting state and cannot be approved by model assertion.

Production promotion always requires explicit human approval under current governance.

### Protected governance

Governance-sensitive assets must be protected through explicit policy.

Protected categories include, as applicable:

```text
Project Charter
AGENTS.md
SECURITY.md
Accepted ADRs
role permissions
quality thresholds
protected-file definitions
Policy Engine rules
production-promotion controls
critical enforcement plugins/hooks
```

An implementation agent must not weaken these assets merely to make its work pass.

### Fail-closed behavior

When a required control cannot determine authorization, a protected action must not proceed automatically.

Examples include:

```text
Policy Engine unavailable
required approval missing
required validation unavailable
actor identity unknown
protected branch state ambiguous
browser control owner unknown
```

The result must be deny, wait, block, or explicit escalation according to policy.

### Auditability

Security- and governance-relevant decisions must produce structured evidence sufficient to determine:

```text
who requested the operation
what capability was requested
what resource was affected
what policy outcome occurred
what workflow state applied
whether human approval was required or present
what correlation/work item applied
```

Audit data must follow the minimization and secret-handling requirements in `SECURITY.md`.

## Consequences

### Positive

- Model mistakes or prompt injection do not automatically become authority for sensitive actions.
- Role restrictions can be enforced independently of model self-reporting.
- Project authorization has one semantic decision layer while retaining multiple technical enforcement points.
- Sensitive operations can move away from unrestricted shell access into testable controllers.
- Human approval requirements can be checked as persisted state rather than inferred from conversation.
- CI and remote protection can catch violations even when a local guard is unavailable.
- Policy decisions become auditable and testable.

### Negative / Trade-offs

- Defense in depth increases implementation complexity.
- Similar restrictions may need adapters at several layers.
- The Policy Engine becomes security-critical infrastructure and requires strong tests.
- Fail-closed behavior can reduce availability when policy infrastructure is unavailable.
- Narrow controllers require additional APIs and state management.
- OpenCode upgrades may require compatibility work for enforcement adapters.

### Neutral / Follow-up

- Implement protected-file configuration during the quality-gate phase.
- Configure OpenCode roles and tool permissions in Phase 4.
- Implement role-enforcement, branch-guard, protected-files, command-guard, and audit plugins where compatible.
- Design Policy Engine contracts before sensitive controller implementation.
- Implement the Git Controller after workflow state and authorization foundations exist.
- Implement Human Gate as a persistent workflow capability.
- Add policy/security tests that verify prohibited paths fail.
- Configure CI and remote branch protection after local invariants exist.
- Browser-specific authorization and control semantics are defined separately in ADR-0006.

## Validation and Confirmation

The architecture must eventually demonstrate deterministic enforcement for at least:

- Architect implementation edits are rejected by the relevant development enforcement path.
- Team Leader implementation edits are rejected by the relevant development enforcement path.
- Developer edits outside authorized scope are rejected.
- Developer attempts to mutate protected governance are rejected without required approval.
- Developer attempts to integrate directly into `test` are rejected.
- Team Leader attempts to bypass Architect approval for `test` integration are rejected.
- production promotion without explicit human approval is rejected.
- a denied semantic capability cannot be reproduced through a general shell or alternate tool path.
- unavailable mandatory policy evaluation does not produce an automatic allow.
- security-relevant policy decisions emit reviewable audit evidence without raw secrets.

The quality system should also test enforcement configuration so weakening a required layer is visible during review.

## Security Considerations

The Policy Engine is part of the trusted computing base and must validate supplied identity and state rather than trusting caller-provided natural language.

Authorization decisions must use authoritative identifiers and persisted state.

A malicious tool result, webpage, MCP response, commit message, or model output must not manufacture an approval record.

OpenCode plugins and permissions reduce development-harness risk but do not make arbitrary third-party plugins trustworthy. Plugin dependencies and updates remain supply-chain concerns.

Controller APIs should reduce confused-deputy risk by checking both requester authority and requested resource/effect.

Policy and audit channels must avoid exposing secrets while preserving useful evidence.

## Operational Considerations

Policy evaluation is expected to occur frequently, so routine checks should remain deterministic and efficient.

Static restrictions may be enforced locally when all required inputs are known, while workflow-sensitive operations require authoritative state.

Mandatory policy infrastructure must expose clear failure states so callers can distinguish denial from system unavailability while still failing safely.

Audit and decision events should use correlation identifiers so multi-step workflows can be reconstructed without relying on conversation transcripts.

Enforcement configuration must remain versioned and reviewable while credentials and runtime secrets stay outside the repository.

## Related Decisions

- ADR-0003 defines the authority hierarchy protected by this enforcement model.
- ADR-0004 defines Git branch and promotion rules enforced through guards, policy, the Git Controller, CI, and human approval.
- ADR-0006 will define shared browser control and Human Gate interactions for browser automation.
- `SECURITY.md` defines broader threat, secret, MCP, logging, and incident requirements supported by this architecture.

## Notes

This ADR intentionally distinguishes policy semantics from enforcement adapters. OpenCode permissions/plugins, Git hooks, and CI are important enforcement points, but none individually defines the full project authority model.

The actual installed OpenCode version and its current permission/plugin interfaces must be verified before implementation-specific configuration is written.

# ADR-0003: Multi-Agent Hierarchy

- **Status:** Accepted
- **Date:** 2026-10-20
- **Decision owners:** Human project owner during bootstrap governance
- **Related governance:** `docs/architecture/PROJECT_CHARTER.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ADR-0001`, `ADR-0002`
- **Supersedes:** None
- **Superseded by:** None

## Context and Problem Statement

The platform is intended both to execute governed automation workflows and to provide a governed development environment in which AI agents can help build the platform itself.

Allowing one unrestricted agent to plan architecture, implement code, approve its own implementation, merge changes, and promote production would collapse separation of duties and make review evidence substantially less meaningful.

The project therefore requires an explicit multi-agent authority model that separates system-level architecture, field coordination, implementation, and research. The model must also define delegation, review, replacement, persistent identity, team-size limits, and the relationship between conversational agents and authoritative workflow state.

This decision is architecturally significant because the hierarchy will shape the Orchestrator, Policy Engine, message contracts, workflow state machine, OpenCode agent profiles, Git Controller, branch authorization, Human Gate, audit events, and future user interface.

OpenCode supports specialized agents with separate prompts, models, tool access, and permissions, and distinguishes primary agents from subagents. This makes it suitable as an initial host for specialized roles, but OpenCode's native agent categories do not themselves define the project's business authority model. The platform must enforce that model independently where required.

## Decision Drivers

- Separate planning, implementation, review, integration authorization, and production approval.
- Prevent an implementation agent from becoming the sole reviewer of its own work.
- Keep system architecture under one coherent authority per development session.
- Allow complex features to be decomposed without giving every agent full repository authority.
- Support bounded delegation and explicit parent/child relationships.
- Preserve task state independently of model conversation context.
- Allow agents with saturated or unreliable context to be replaced safely.
- Make review and correction cycles explicit and auditable.
- Limit local inference concurrency to fit the available workstation resources.
- Allow read-oriented research without granting implementation or merge authority.
- Map the governance model onto OpenCode while avoiding dependence on model self-compliance alone.

## Considered Options

### Option A: Hierarchical Architect -> Team Leader -> Developer model with auxiliary Researcher

Use explicit authority levels, separate implementation from review, keep one Architect per development session, and model Researcher as advisory rather than implementation authority.

### Option B: Flat peer-agent pool

Allow multiple equivalent agents to select tasks, review one another, and coordinate through shared state without a fixed authority hierarchy.

### Option C: Single general-purpose development agent

Use one agent to plan, implement, test, review, and integrate most project work.

### Option D: Human-directed Developers without AI leadership roles

Use the human operator as the only planner/coordinator and restrict AI agents to direct implementation or research tasks.

## Decision Outcome

> We will use a hierarchical development organization consisting of one Architect, one or more Team Leaders within configured limits, Developers assigned by their Team Leader, and an auxiliary Researcher role without implementation authority.

The normal implementation authority path is:

```text
Human
  |
Architect
  |
Team Leader
  |
Developer
```

The Researcher sits outside that implementation authority chain and provides read-oriented evidence to authorized requesters.

### Architect

The Architect owns system-level technical governance for the development session.

The Architect:

- plans architecture,
- defines feature boundaries and constraints,
- establishes quality and testing expectations,
- creates or assigns Team Leaders,
- reviews completed Team Leader feature submissions,
- authorizes eligible integration into `test` through the governed workflow,
- evaluates evidence-backed architectural feedback,
- may retain or replace Team Leaders,
- must escalate governance changes requiring human approval.

There may be no more than one active Architect in a development session.

The Architect must not implement production code as part of the normal workflow.

### Team Leader

A Team Leader owns field coordination for an Architect-assigned feature scope.

The Team Leader:

- decomposes the feature into bounded tasks,
- creates or assigns Developers within configured limits,
- issues complete work orders,
- reviews Developer submissions,
- requests corrections when necessary,
- integrates approved Developer work into the authorized Team Leader branch through the governed mechanism,
- validates the integrated feature,
- submits the feature to the Architect.

The Team Leader must not implement production code as part of the normal workflow and must not merge directly into `test`.

### Developer

The Developer is the implementation role.

The Developer:

- writes authorized production code,
- creates or updates required tests,
- executes required self-validation,
- works within the assigned branch and task scope,
- produces a structured delivery report,
- corrects findings returned by the Team Leader.

The Developer must not approve its own work for integration and must not merge into `test` or production.

### Researcher

The Researcher is a read-oriented auxiliary role.

The Researcher may inspect repository content and approved external technical sources and return evidence or recommendations. It does not gain code-edit, merge, release, or architectural authorization simply because another agent invoked it.

### Authoritative identity

Agent identity and role are properties of persistent harness state rather than claims made in conversation.

An agent record must eventually be capable of representing fields such as:

```text
agent_id
session_id
role
status
model
parent_agent_id
feature_id
task_id
```

The model cannot elevate itself by declaring a different role.

### Delegation

The normal creation/delegation chain is:

```text
Human/system bootstrap -> Architect
Architect              -> Team Leader
Team Leader            -> Developer
Authorized requester   -> Researcher, subject to policy
```

A child agent must not receive authority beyond its configured role.

### Replacement

Agent instances are replaceable, while authoritative task and feature state must survive replacement.

Before intentionally replacing a Team Leader, its active Developers must be stopped, transferred, or otherwise assigned unambiguous ownership through the governed process.

Before replacing a Developer, the Team Leader must preserve enough state to hand the task to a replacement without depending on hidden conversation history.

### Initial team limits

The initial logical execution profile is:

```text
Architects per session: 1
Active Team Leaders: 1
Developers per active Team Leader: 1
Local heavyweight LLM inference concurrency: 1
Interactive browser concurrency: 1
```

The architecture must support configurable increases later, but increased logical team size does not imply equivalent simultaneous local inference.

## Consequences

### Positive

- Separates architecture, implementation, review, and production authority.
- Prevents the Developer role from being the sole approver of its own implementation.
- Gives the project a single system-level architectural authority per development session.
- Makes delegation and review chains explicit and auditable.
- Allows task scopes and permissions to be narrowed by role.
- Supports replacing an agent when its conversational context becomes unreliable without losing authoritative task state.
- Allows Researchers to gather evidence without automatically obtaining write authority.
- Maps naturally to specialized OpenCode agent profiles with distinct prompts, models, and permissions.
- Creates clear authorization questions for the future Policy Engine and Git Controller.

### Negative / Trade-offs

- More agents and workflow states create orchestration complexity compared with a single autonomous coding agent.
- Multiple review layers can increase latency for small changes.
- Hierarchical workflows require structured messages and persistent task state to avoid relying on informal conversation.
- Strict separation means an Architect or Team Leader cannot simply fix an implementation directly when a Developer makes a small mistake; the correction must remain in the governed implementation path.
- Role boundaries require deterministic tool and branch enforcement to be trustworthy.
- Local-resource limits mean logical parallelism may exceed actual inference parallelism, requiring scheduling or queues.

### Neutral / Follow-up

- The Orchestrator must implement authoritative agent lifecycle and parent/child relationships.
- Agent contracts must define feature assignments, task assignments, deliveries, reviews, corrections, blockers, and handoffs.
- The Policy Engine must evaluate role, scope, state, and approvals before sensitive operations.
- OpenCode profiles must be configured so Architect and Team Leader are read/review oriented while Developer receives bounded implementation tools.
- Git branch rules and promotion authority are specified separately in ADR-0004.
- The correction-loop limit remains initially three unsuccessful cycles at a review stage as defined by agent governance.
- The initial model mapping remains governed by `AGENTS.md`; changing a model does not change role authority.

## Validation and Confirmation

Initial compliance can be checked through governance review and, after implementation, through deterministic tests.

The implemented system must eventually verify at least:

- no second active Architect can be created for the same development session,
- only an Architect-authorized path can create or assign a Team Leader,
- only a Team Leader-authorized path can create or assign a Developer under that feature,
- a Developer cannot authorize its own integration,
- a Team Leader cannot perform Architect-only `test` integration authorization,
- a Researcher cannot acquire implementation authority through invocation,
- agent role comes from harness state rather than model-provided text,
- configured team cardinality limits are enforced,
- agent replacement preserves authoritative feature/task state,
- termination of a Team Leader does not leave child Developers with ambiguous ownership.

Security and workflow tests should attempt prohibited role transitions and confirm they are denied.

## Security Considerations

Role separation reduces the impact of a compromised or prompt-injected development agent only if permissions are enforced deterministically.

A prompt telling a Developer to become the Architect must not alter harness identity or authorization.

Parent/child relationships must not allow privilege escalation. Creating a subagent must never be a mechanism for escaping the caller's governance constraints.

Messages claiming approval must be validated against authoritative sender identity, role, workflow state, and approval records.

Sensitive capabilities must be evaluated independently of model strength. A more capable model does not receive more authority merely because it produces higher-quality reasoning.

Replacing agents must avoid leaking unnecessary context, secrets, or credentials into handoff records.

OpenCode-level permissions are one enforcement layer, not the sole business authorization boundary.

## Operational Considerations

The initial workstation has finite CPU and memory, so the Orchestrator must distinguish between agents that logically exist and model inferences that execute simultaneously.

With the initial configuration, only one heavyweight local LLM inference should execute at a time unless later measurement supports a safe increase.

Agent lifecycle operations must be observable so the human can determine which agents exist, their parent relationships, assignment, and status.

Long-lived conversational context should be kept bounded. Important state belongs in persistent contracts and workflow storage so an agent can be replaced or restarted.

The future UI should expose at least current session, active agents, hierarchy, assigned feature/task, status, blockers, and pending approval/review states.

## Related Decisions

- ADR-0001 establishes the primary TypeScript/Node.js implementation ecosystem for the harness.
- ADR-0002 establishes the monorepo in which agent infrastructure and contracts are implemented.
- ADR-0004 will define Git branching, integration, and production promotion authority.
- ADR-0005 will define deterministic policy enforcement and defense in depth.
- ADR-0006 will define shared browser control, which is a separate capability authority from development-role authority.

## Notes

`AGENTS.md` contains the detailed operational policy for each role. This ADR records the architectural decision to use the hierarchy itself; it does not duplicate every operational rule.

OpenCode's concepts of primary agents and subagents are implementation capabilities that can help host this architecture, but they are not equivalent to the project's Architect, Team Leader, Developer, and Researcher authority model. The Orchestrator and Policy Engine remain responsible for project-level identity and authorization as implementation progresses.

# Multi-Agent Automation Platform - Project Charter

## 1. Purpose

The Multi-Agent Automation Platform is a governed, extensible system for
researching information, reasoning over retrieved evidence, executing
controlled browser interactions, processing batch workloads, and coordinating
human participation when autonomous execution is not appropriate or permitted.

The platform is intended to provide reusable infrastructure for multiple
automation workflows. Site-specific workflows must be implemented on top of
the platform rather than embedded into its core architecture.

The system must favor correctness, traceability, explicit control, and
recoverability over unrestricted autonomy.

---

## 2. Core Objectives

The platform must provide the foundations required to:

1. Coordinate specialized AI agents with clearly separated responsibilities.
2. Research and retrieve information from web-accessible sources.
3. Expose controlled capabilities through MCP servers and other governed tools.
4. Execute batch-oriented workflows.
5. Maintain persistent workflow state and support recovery after interruption.
6. Allow an AI agent and a human operator to interact with the same browser
   session through explicit transfer of control.
7. Inspect browser state before deciding which action to perform.
8. Execute controlled browser interactions such as navigation, text entry,
   selection, form interaction, waiting, and other user-interface actions.
9. Pause workflows when human participation is required.
10. Resume workflows after explicit human confirmation.
11. Record sufficient evidence to audit important decisions, approvals,
    tool invocations, workflow transitions, and browser actions.
12. Enforce architectural, security, quality, and workflow policies outside
    the language model whenever deterministic enforcement is possible.

---

## 3. Guiding Principles

### 3.1 Governed Autonomy

AI agents may reason, propose actions, delegate permitted work, and request
tools, but critical permissions and state transitions must not depend solely
on model compliance.

Deterministic software must enforce critical authorization rules.

The fundamental execution principle is:

> The model proposes. The harness authorizes. Deterministic components execute.

---

### 3.2 Least Privilege

Every agent, tool, service, and workflow must receive only the permissions
required to perform its assigned responsibility.

Permissions must be separated by role and capability.

A component must not gain broader privileges merely because those privileges
would simplify implementation.

---

### 3.3 Separation of Responsibilities

Planning, implementation, review, authorization, and production promotion are
separate responsibilities.

The system must preserve this separation technically, not only through prompt
instructions.

---

### 3.4 Human Authority

A human operator retains final authority over sensitive actions and production
promotion.

The system must support explicit human approval, rejection, interruption, and
control transfer.

Production promotion must require explicit human approval.

---

### 3.5 Evidence Before Trust

A task is not considered complete simply because an agent reports completion.

Important claims about implementation and execution must be supported by
machine-verifiable evidence whenever possible, including tests, command exit
codes, repository state, structured delivery reports, tool results, and audit
events.

---

### 3.6 Deterministic Enforcement

Prompts guide agent behavior but are not security boundaries.

Critical rules must be reinforced through appropriate deterministic
mechanisms such as:

- tool permissions,
- OpenCode plugins and hooks,
- policy evaluation,
- controller APIs,
- Git hooks,
- automated tests,
- continuous integration,
- protected branches,
- approval gates.

No single enforcement layer should be treated as sufficient for critical
policies.

---

### 3.7 Recoverability

Long-running and batch workflows must be designed for interruption.

Where appropriate, workflow state must be persisted so execution can be
inspected, paused, resumed, retried, or marked as blocked without relying
solely on a model's conversation context.

---

### 3.8 Observability and Auditability

Important actions must produce structured events.

The system must make it possible to determine:

- what action occurred,
- which actor requested it,
- which workflow and task it belonged to,
- whether it was allowed or rejected,
- when it occurred,
- what relevant evidence was produced.

Secrets and authentication credentials must not be written to audit logs.

---

### 3.9 Explicit Failure

The platform must prefer visible failure over silently bypassing a required
validation, policy, review, or security control.

If a required control cannot be executed, the workflow must fail, pause, or
enter a blocked state according to policy.

A failing quality gate must not be converted into a passing result by
weakening the gate without the required architectural approval.

---

## 4. Agent Governance Model

The initial governed development organization consists of four roles:

- Architect
- Team Leader
- Developer
- Researcher

Only the Developer role is authorized to implement production code as part of
the normal development workflow.

The Researcher is an auxiliary role and is not part of the development
authority hierarchy.

---

## 5. Architect

There must be no more than one active Architect within a development session.

The Architect is responsible for:

- system architecture,
- technical direction,
- decomposition of major capabilities,
- architectural consistency,
- quality policies,
- testing strategy,
- integration policies,
- review of Team Leader submissions,
- maintaining architectural decisions,
- deciding whether Team Leaders remain assigned or are replaced.

The Architect may create and instruct Team Leaders.

The Architect must not implement production code.

The Architect must not bypass established quality or architectural controls.

If an established architectural rule must be changed to continue legitimate
development, the Architect must explain the reason and obtain the required
human approval before the protected rule is changed.

The Architect controls authorization for integration into the `test` branch
through the governed workflow.

The Architect cannot authorize production promotion without explicit human
approval.

---

## 6. Team Leader

A Team Leader is created or assigned by the Architect for a defined feature or
development scope.

A Team Leader is responsible for:

- understanding the Architect's specification,
- decomposing the assigned feature into actionable development tasks,
- issuing complete and bounded instructions to Developers,
- defining acceptance criteria for those tasks,
- reviewing Developer changes,
- verifying required tests and quality controls,
- requesting corrections when necessary,
- integrating approved Developer work into the Team Leader's governed branch,
- submitting completed feature work for Architect review.

A Team Leader may create and instruct Developers according to configured
resource limits.

A Team Leader must not implement production code.

A Team Leader must not merge directly into `test`.

A Team Leader may challenge an architectural decision when implementation
evidence reveals a meaningful obstacle, risk, or superior alternative.

Such disagreement must be communicated constructively with supporting
evidence. Final architectural authority remains with the Architect unless the
decision requires human approval.

---

## 7. Developer

A Developer is created or assigned by a Team Leader for a bounded development
task.

The Developer is responsible for:

- implementing the assigned code,
- creating or updating the required tests,
- remaining within the authorized file and task scope,
- executing required validations before submitting work,
- providing a structured delivery report,
- correcting findings returned by the Team Leader.

A Developer must work only on the governed Developer branch assigned to the
task.

A Developer may not approve its own work for integration.

A Developer may not merge into `test` or production.

A Developer may not weaken protected quality, architectural, security, or
workflow policies in order to make its implementation pass validation.

---

## 8. Researcher

The Researcher is an auxiliary, read-oriented role.

The Researcher may investigate:

- the local codebase,
- architecture documentation,
- dependency documentation,
- external technical documentation,
- approved web resources.

The Researcher may provide evidence and recommendations to the Architect or a
Team Leader.

The Researcher must not modify production code, authorize merges, promote
releases, or modify protected project policies.

---

## 9. Development Workflow

The intended development hierarchy is:

```text
Human
  |
Architect
  |
Team Leader
  |
Developer
```

The normal implementation path is:

```text
plan
  -> leader assignment
  -> task decomposition
  -> developer assignment
  -> development
  -> developer self-validation
  -> leader review
  -> correction if required
  -> leader approval
  -> architect review
  -> correction if required
  -> test integration
  -> integration validation
  -> human approval
  -> production promotion
  ```

Review failures must result in correction or an explicit
blocked state rather than silent acceptance.
Repeated unsuccessful correction cycles must be bounded.
Reaching the configured limit must escalate the task for
reassessment rather than produce an infinite agent loop.

---

## 10. Git Governance

The intended branch hierarchy is:

```text
main
  ^
test
  ^
lider_<feature>
  ^
dev_<feature>_<task>

```

*main* represents the production branch.

*test* is the Architect-governed integration branch.

Each Team Leader uses a branch following the convention:

```text
lider_<feature>
```

Each Developer uses a branch following the convention:

```text
dev_<feature>_<task>
```

Direct Developer integration into *test* is prohibited.

Direct Team Leader integration into *main* is prohibited.

Production promotion requires explicit human approval.

Critical Git operations should progressively move behind
deterministic controllers rather than unrestricted
model-generated shell commands.

---

## 11. Quality Governance

Quality controls must be established before substantial
feature development.

The project will maintain automated controls covering, as appropriate:

- formatting,
- static analysis,
- type checking,
- unit testing,
- integration testing,
- contract testing,
- end-to-end testing,
- architectural dependency rules,
- protected file validation,
- branch naming,
- secret detection,
- commit policy.

Fast checks should run early in the development cycle.

More expensive integration and end-to-end checks may run at later gates.

Mandatory checks must block progression when they fail.

Protected quality controls must not be weakened solely to allow a failing implementation to proceed.

---

## 12. Human-in-the-Loop Model

The platform must support explicit human participation as a first-class workflow capability.

A workflow may enter states such as:

```text
WAITING_FOR_CONFIRMATION
WAITING_FOR_LOGIN
WAITING_FOR_BROWSER_CONTROL
WAITING_FOR_SENSITIVE_ACTION
WAITING_FOR_PRODUCTION_APPROVAL
BLOCKED
```

Human participation must be represented by explicit workflow state
rather than unstructured assumptions such as arbitrary sleep
durations whenever a deterministic confirmation mechanism is
possible.

The human operator must be able to approve, reject, interrupt, or
resume operations according to policy.

---

## 13. Shared Browser Model

The product must support a persistent browser session that can be used by both the human operator and authorized automation.

The system must prevent uncontrolled simultaneous interaction by the human and the agent.

Browser control must therefore use explicit ownership or lease semantics.

At any relevant moment, control should conceptually belong to:

```text
human
agent
none
```

Sensitive transitions must support explicit control transfer.

For example:

```text
agent controls browser
  -> authentication is required
  -> agent releases control
  -> workflow enters WAITING_FOR_LOGIN
  -> human completes authentication
  -> human explicitly confirms continuation
  -> browser state is observed again
  -> agent may reacquire control
```

Human operators must be able to interrupt automated browser control.

---

## 14. Browser Perception

Browser automation must observe the relevant state before acting.

The perception layer should support multiple forms of evidence where appropriate:

1. accessibility information,
2. structured DOM information,
3. technical browser state,
4. screenshots or visual evidence.

Structured representations should be preferred when they provide sufficient information.

Screenshots should be available for evidence and cases where structured information is insufficient.

Raw page content must be treated as untrusted external input.

---

## 15. Web Research and Browser Interaction

Web research and interactive browser control are separate capabilities.

Web research is responsible for capabilities such as:

```text
search
fetch
extract
normalize
cite
cache
```

Interactive browser control is responsible for capabilities such as:

```text
observe
navigate
locate
propose
execute
verify
wait
handoff
resume
capture
```

A workflow should not require interactive browser automation when
a simpler, authorized research operation is sufficient.

---

## 16. MCP and Tooling Principles

MCP servers and other tools are capability boundaries.

Tools must expose focused operations rather than unrestricted access whenever practical.

MCP and tool access must be assigned according to role and workflow needs.

Sensitive tools must be protected by policy evaluation and, where required, human approval.

The platform must avoid exposing unnecessary tools to each model.

Tool results must be treated as data, not as instructions that can override system, architectural, security, or human policy.

---

## 17. Web Automation Safety

The platform must not be designed to bypass legitimate access controls, authentication protections, CAPTCHA systems, rate limits, or equivalent security mechanisms.

When human authentication or verification is required, the workflow should pause and transfer control according to policy.

Automation must support controlled pacing, waiting, retries, and rate limits for reliability and responsible resource use.

Site-specific automation must be isolated from the generic browser and agent infrastructure whenever practical.

---

## 18. External Content and Prompt Injection

Web pages, retrieved documents, tool results, form content, messages, and other externally obtained information must be treated as untrusted data.

External content must not gain authority merely because it contains text that resembles instructions to an AI model.

Instructions retrieved from external content must not override:

- system policy,
- project policy,
- agent role restrictions,
- security controls,
- human approvals,
- workflow authorization.

Actions derived from untrusted content must remain subject to normal tool and policy enforcement.

---

## 19. State and Messaging

Important workflow state must exist outside transient model context.

The platform must provide persistent representations for concepts such as:

- sessions,
- agents,
- features,
- tasks,
- messages,
- reviews,
- approvals,
- workflow transitions,
- browser sessions,
- control leases,
- audit events.

Agent-to-agent communication should use structured messages for workflow critical operations.

Free-form conversation may assist reasoning but must not replace structured state for critical transitions.

---

## 20. Structured Agent Deliveries

Workflow-critical agent outputs must use machine-validatable contracts where appropriate.

A Developer delivery, for example, should be capable of representing:

- task identifier,
- branch,
- created files,
- modified files,
- tests created,
- validations executed,
- validation results,
- requirements covered,
- known limitations,
- commit identifier.

A review should be capable of representing:

- decision,
- findings,
- severity,
- affected location,
- expected correction,
- required validation.

Invalid or incomplete critical contracts must not silently advance workflow state.

---

## 21. Resource Governance

The initial deployment target is a local development workstation with finite CPU and memory resources.

Agent existence and model inference concurrency must therefore be treated as different concerns.

The initial execution profile will favor conservative concurrency and bounded resource use.

The platform must make concurrency configurable rather than assuming unrestricted parallel execution.

Resource limits may evolve after measurement and benchmarking.

---

## 22. Technology Direction

The initial technology direction is:

- TypeScript as the primary implementation language,
- Node.js as the primary application runtime,
- pnpm workspaces for monorepo package management,
- PostgreSQL for persistent workflow, messaging, and audit state,
- OpenCode as the initial agent development harness,
- Ollama for local model execution,
- MCP for exposing selected tool capabilities,
- Playwright as the initial browser automation foundation,
- Docker for service isolation and deployment where appropriate.

Python may be used for specialized capabilities where its ecosystem provides a clear advantage.

Java is not part of the initial application runtime unless a future architectural decision introduces a justified requirement.

Detailed technical choices and changes to these directions must be recorded through Architecture Decision Records where architecturally significant.

---

## 23. Initial Resource Profile

The initial development workstation baseline is:

```text
CPU: AMD Ryzen 5 8500G
RAM: 32 GB
Local model runtime: Ollama
```

The initial logical agent configuration is:

```text
Architect: 1
Team Leaders: 1
Developers per active Team Leader: 1
Local heavyweight LLM inference concurrency: 1
Interactive browser concurrency: 1
```

Higher concurrency must be introduced only after measurement demonstrates that it preserves system stability.

---

## 24. Secrets and Sensitive Information

Secrets must not be committed to the repository.

Credentials must not be embedded in:

- prompts,
- source code,
- test fixtures,
- logs,
- screenshots intended for persistent audit,
- structured messages,
- example configuration.

Sensitive data must be redacted from persisted evidence where required.

Authentication secrets should remain under human or dedicated
secret-management control rather than becoming ordinary model
context.

---

## 26. Change Management

Architecturally significant decisions must be documented.

When a previously accepted architectural decision must change, the project must preserve the decision history rather than rewriting history as if the old decision never existed.

Changes affecting protected governance require the approval defined by the applicable policy.

Human approval is mandatory when the established governance model explicitly requires it.

---

## 27. Initial Delivery Strategy

Development will proceed incrementally.

The initial milestones are:

1. repository and runtime bootstrap,
2. project governance,
3. automated quality gates,
4. OpenCode agent configuration,
5. deterministic role enforcement,
6. structured agent contracts,
7. persistent state and messaging,
8. orchestration workflow,
9. governed Git operations,
10. human approval gates,
11. shared browser runtime,
12. browser-control MCP,
13. human/browser handoff,
14. web-research capability,
15. advanced browser interactions,
16. user interface,
17. batch execution,
18. observability,
19. containerized deployment,
20. security hardening.

Each milestone must define acceptance criteria before it is
considered complete.

---

## 28. Initial Success Criteria

The first major system milestone is reached when:

1. an Architect can define a bounded feature,
2. a Team Leader can decompose the feature into an executable
development task,
3. a Developer can implement the task on an authorized branch,
4. deterministic controls prevent role and branch violations,
5. the Developer can provide machine-validatable evidence of
completed validation,
6. the Team Leader can approve or reject the delivery,
7. rejected work returns through a bounded correction cycle,
8. approved work can be submitted to the Architect,
9. the Architect can approve or reject integration into test,
10. the harness preserves the relevant workflow evidence.

Browser automation is intentionally not required for this first
governance milestone.

---

## 30. Charter Authority

This Charter defines the high-level boundaries and governing principles of the Multi-Agent Automation Platform.

Detailed architectural decisions belong in Architecture Decision Records.

Detailed agent operating rules belong in the agent governance documentation.

Detailed quality requirements belong in the quality configuration and testing policies.

Detailed security requirements belong in the security documentation and enforcement mechanisms.

When implementation conflicts with this Charter, the conflict must be resolved explicitly rather than silently implementing behavior contrary to the Charter.

Material changes to this Charter require explicit human approval.

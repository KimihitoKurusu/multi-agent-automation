# Multi-Agent Automation Platform - Security Policy

## 1. Purpose

This document defines the initial security policy for the Multi-Agent Automation Platform.

The platform combines AI agents, external content, MCP servers and tools, persistent workflow state, Git operations, authenticated browser sessions, human approvals, and eventually automated actions with real side effects. Security therefore must be treated as a system property rather than a prompt-writing concern.

This policy applies to human contributors, AI agents, local services, MCP servers, browser automation, workflow execution, and project infrastructure.

---

## 2. Governing Security Principle

The security model follows the project execution principle:

> The model proposes. The harness authorizes. Deterministic components execute.

Model output is not authorization.

External content is not authority.

Successful execution is not proof that an action was authorized.

Critical security decisions must be enforced outside the language model whenever deterministic enforcement is possible.

---

## 3. Security Objectives

The platform must protect:

- human authority,
- credentials and authentication material,
- repository integrity,
- workflow integrity,
- agent role boundaries,
- browser-session integrity,
- persistent state,
- audit evidence,
- MCP and tool boundaries,
- local host resources,
- external services from unauthorized or uncontrolled actions.

The platform must favor safe failure over silent bypass of a required security control.

---

## 4. Threat Model

The initial design assumes that potentially hostile or malformed input may arrive through:

- user-provided content,
- websites,
- HTML and DOM content,
- accessibility trees,
- screenshots and visual content,
- downloaded files,
- documents,
- search results,
- tool responses,
- MCP tool descriptions and results,
- dependency packages,
- repository content from untrusted branches,
- messages passed between components,
- environment configuration.

The system must not assume that content is trustworthy because it is syntactically valid, human-readable, or returned by a configured tool.

---

## 5. Trust Boundaries

The architecture must explicitly recognize trust boundaries among at least:

```text
Human operator
AI model
OpenCode / agent harness
Orchestrator
Policy Engine
Human Gate
Git Controller
Browser Controller
Browser Runtime
MCP clients
MCP servers
External websites and services
PostgreSQL
Local host
Containerized services
Repository
```

Data crossing a trust boundary must be treated according to the receiving component's validation and authorization requirements.

---

## 6. Least Privilege

Every agent, service, tool, token, browser capability, database identity, and external integration must receive only the permissions required for its responsibility.

Do not grant broad access simply because it simplifies implementation.

A child agent must not gain greater authority than its assigned role permits.

A tool must not use broad service credentials when narrower credentials are sufficient.

---

## 7. Defense in Depth

No single control is sufficient for critical operations.

Security-sensitive restrictions should be reinforced through multiple appropriate layers, including:

```text
agent instructions
OpenCode permissions
OpenCode plugins/hooks
Policy Engine
narrow controller APIs
Git hooks
quality gates
CI
remote branch protection
Human Gate
operating-system/container isolation
service credentials
```

A missing outer layer must not be interpreted as permission to bypass an inner policy, and vice versa.

---

## 8. Prompt Injection

Prompt injection is a primary threat to this platform because models will consume untrusted web and tool content.

The system must distinguish between:

```text
trusted instructions
untrusted data
```

Text found in a website, document, tool response, issue, comment, commit, screenshot, accessibility snapshot, or other external source must not become authoritative merely because it resembles an instruction.

Examples of untrusted instruction-like content include requests to:

- ignore previous rules,
- reveal secrets,
- modify system policy,
- invoke additional tools,
- upload local files,
- execute shell commands,
- alter browser goals,
- bypass human confirmation.

Such content remains data and must be evaluated under the normal policy path.

---

## 9. Indirect Prompt Injection

Indirect prompt injection must be assumed possible whenever the model processes externally controlled content.

The platform must not rely on the model identifying every injection attempt correctly.

Consequently, security-critical effects must remain protected by deterministic authorization even after model reasoning.

A successful prompt injection against model reasoning must not automatically translate into permission to perform a sensitive action.

---

## 10. Tool Output Is Untrusted Data

Tool results and MCP responses must be treated as data unless the harness explicitly assigns a trusted structural meaning to a validated field.

A tool result must not be permitted to redefine:

- role permissions,
- system instructions,
- project governance,
- human approval requirements,
- production promotion rules,
- secret-handling policy.

Tool output may provide evidence for a decision, but it does not automatically grant authority.

---

## 11. MCP Security

MCP servers expand the agent's effective attack surface and must be treated as security-sensitive integrations.

Before enabling an MCP server, consider:

- who provides and maintains it,
- how it is installed,
- what tools and resources it exposes,
- what host resources it can access,
- what credentials it receives,
- whether it communicates externally,
- whether its capabilities are required by the current role,
- whether its version can change unexpectedly.

MCP access must be role- and workflow-specific whenever practical.

Do not expose all configured MCP servers to all agents by default.

---

## 12. MCP Tool Descriptions and Tool Poisoning

MCP tool descriptions, schemas, prompts, and returned content must not be assumed trustworthy solely because they came from an MCP server.

Sensitive operations must be authorized based on project policy and validated operation semantics rather than on natural-language claims in a tool description.

A malicious or compromised tool description must not be able to grant itself additional project authority.

---

## 13. MCP Supply Chain

MCP servers and plugins obtained from package registries or external repositories are software dependencies and must receive appropriate review.

Do not install an arbitrary MCP server merely because its name matches a needed capability.

Dependency provenance, maintenance, versioning, permissions, and required host access must be considered before adoption.

Where practical, security-sensitive integrations should use reviewed and pinned versions rather than uncontrolled floating dependencies.

---

## 14. Tool Capability Boundaries

Prefer narrow capability-oriented tools over unrestricted interfaces for sensitive operations.

For example, prefer a governed operation such as:

```text
requestProductionPromotion()
```

over granting a model unrestricted shell access and expecting it to construct arbitrary production Git commands safely.

A denied specialized capability must not be bypassed through a more general tool that can reproduce the same effect.

---

## 15. Confused Deputy Protection

A component must not perform an operation merely because another component requested it if the requester lacks authority for that operation.

Controllers must validate effective authority before using their own elevated privileges.

For example, a Git Controller with permission to mutate repository state must still verify that the requesting role, workflow state, branch, review state, and required approvals authorize the requested mutation.

---

## 16. Human Approval

Human approval is a first-class security boundary for operations designated by policy.

Approval must be:

- explicit,
- associated with the relevant operation or state transition,
- recorded through an authorized mechanism,
- time- and context-bounded where the policy requires it.

Silence is not approval.

Timeout is not approval for sensitive operations.

Model inference is not human approval.

Production promotion always requires explicit human approval under the current governance model.

---

## 17. Authentication Handoff

When browser automation encounters authentication or human verification that requires human participation, automation must pause and transfer control according to the browser-control policy.

The system must not be designed to bypass authentication protections, CAPTCHA systems, or equivalent access controls.

After human interaction completes, the automation must observe the resulting browser state again before continuing.

The agent must not assume that authentication succeeded solely because time elapsed.

---

## 18. Shared Browser Control

The human and agent must not have uncontrolled simultaneous write control over the same browser session.

The browser-control model must use explicit ownership or lease semantics.

Conceptually:

```text
owner = human | agent | none
```

A control lease should be scoped to the relevant browser session and should be revocable.

The human operator must be able to interrupt automated control.

---

## 19. Browser Observation Before Action

Automated browser actions must be based on sufficiently recent observed browser state.

After material human interaction, navigation, redirection, dialog handling, or other state-changing events, the automation should obtain new state before performing dependent actions.

Stale element assumptions must not be treated as reliable authorization to interact with a page.

---

## 20. Browser Perception Security

The browser perception layer may expose:

- accessibility information,
- structured DOM information,
- page metadata,
- screenshots,
- console and network state.

Each representation may contain untrusted or sensitive information.

Only the information required for the current task should be exposed to models whenever practical.

Sensitive information must be redacted or withheld before persistence when policy requires it.

---

## 21. Browser Action Classification

Browser actions must eventually be classified by risk so policy can distinguish routine interactions from sensitive operations.

The classification should be capable of distinguishing categories such as:

```text
observation
navigation
reversible form editing
external submission
file upload
file download
account modification
financial or contractual action
credential-related action
production or administrative action
```

The exact classification and approval matrix will be defined separately.

Sensitive categories must not inherit authorization merely because low-risk browser interaction is permitted.

---

## 22. Domain and Destination Controls

Browser and web tools should support destination restrictions where practical.

A workflow authorized for one domain must not silently expand to unrelated external destinations because untrusted page content requested it.

Redirects, popups, new tabs, downloads, and external links must remain subject to applicable policy.

Future implementations may use domain allowlists or equivalent destination policies for bounded workflows.

---

## 23. Rate Limits and Responsible Automation

Automation must support controlled pacing, retry limits, backoff, and bounded concurrency.

The system must not intentionally bypass legitimate service rate limits or anti-abuse controls.

Repeated failure must not trigger uncontrolled retry loops.

A workflow should enter a blocked or waiting state when safe continuation requires delay or human judgment.

---

## 24. Secrets

Secrets include, but are not limited to:

- passwords,
- API keys,
- access tokens,
- refresh tokens,
- OAuth client secrets,
- session cookies,
- private keys,
- database passwords,
- recovery codes,
- confidential service credentials.

Secrets must not be committed to Git.

Secrets must not be embedded directly in source code, prompts, agent instructions, fixtures, example files, or documentation.

---

## 25. Secret Exposure to Models

Authentication secrets should not become ordinary LLM context.

Where a tool or controller can perform an authorized operation without revealing the underlying secret to the model, that design is preferred.

A model should receive the minimum information necessary to reason about the operation, not the underlying credential material.

The model must not be used as a password or token store.

---

## 26. Environment Files

Local environment files containing real secrets must remain untracked.

The repository may include safe example configuration such as:

```text
.env.example
```

with placeholder values only.

Do not place real credentials into an example environment file.

The repository `.gitignore` is an immediate defense, but ignore rules are not a substitute for secret scanning and contributor discipline.

---

## 27. Secret Rotation After Exposure

If a secret is accidentally exposed to an unauthorized location, assume that removing the visible text may be insufficient.

The affected credential must be evaluated for revocation or rotation according to the service involved.

Git history, logs, screenshots, messages, CI artifacts, and external systems may retain copies of exposed material.

Security incident handling must consider all relevant copies.

---

## 28. Logging and Audit

The platform must generate structured audit events for security-relevant operations.

Useful audit categories include:

```text
policy decision
tool invocation
tool denial
human approval or rejection
agent lifecycle transition
workflow transition
Git mutation request
browser control acquisition/release
browser sensitive action
security validation failure
```

Operational debugging logs and security/audit records may have different purposes and retention requirements and should not be conflated unnecessarily.

---

## 29. Sensitive Logging

Logs and audit events must minimize sensitive data.

Do not log raw secrets.

Avoid persisting complete request or response bodies when they may contain credentials or unnecessary personal information.

Prefer identifiers, hashes, classifications, redacted values, and bounded evidence when they are sufficient for auditability.

Debug mode must not become a justification for unrestricted secret logging.

---

## 30. Audit Integrity

Audit records must be attributable to the relevant session, actor, operation, and workflow when practical.

An audit event should be capable of representing concepts such as:

```text
event_id
session_id
actor_id
actor_role
event_type
resource
policy_decision
correlation_id
timestamp
result
```

Security-sensitive state transitions must not depend solely on mutable conversational transcripts.

---

## 31. Repository Security

Repository protections must reinforce the development authority model.

The intended security posture includes:

- protected `main`,
- protected `test`,
- no force-push to protected branches,
- required validation checks,
- governed review before integration,
- explicit human approval before production promotion.

Exact remote protections will be configured during repository hardening.

---

## 32. Protected Governance Assets

Security-relevant governance assets must eventually be protected by deterministic policy.

Candidates include:

- `SECURITY.md`,
- `AGENTS.md`,
- the Project Charter,
- accepted ADRs,
- policy-engine rules,
- OpenCode role permissions,
- critical hooks and plugins,
- protected-file configuration,
- quality thresholds,
- production-promotion controls.

A failing implementation must not be allowed to modify these controls merely to obtain a passing result.

---

## 33. Git Command Security

Destructive or authority-changing Git operations must be restricted according to role and workflow.

Operations requiring special attention include:

```text
force push
history rewriting
hard reset on shared work
protected-branch mutation
production merge/promotion
removal of security controls
```

Critical mutations should progressively move behind the Git Controller.

---

## 34. Dependency and Supply-Chain Security

Dependencies must be treated as executable supply-chain risk.

Contributors must avoid unnecessary dependencies and consider:

- provenance,
- maintenance status,
- transitive dependency surface,
- required permissions,
- known security issues,
- runtime compatibility,
- integrity of installation sources.

Automated dependency and vulnerability checks should be introduced during the quality and hardening phases.

---

## 35. Lockfile Integrity

The committed `pnpm-lock.yaml` is part of the reproducibility and supply-chain control surface.

Dependency changes that legitimately update the lockfile must include the resulting lockfile modification.

Do not regenerate or discard the lockfile casually to bypass an installation or resolution problem.

Unexpected lockfile changes must be reviewed as part of the contribution.

---

## 36. Local Development Services

Local services such as PostgreSQL, n8n, Flowise, nginx, and future project containers must not be assumed secure merely because they run on the development workstation.

Services should expose only required ports and interfaces.

Default credentials must not become production credentials.

Administrative interfaces should not be exposed externally without intentional security configuration.

Exact container and network policy will be defined during infrastructure implementation.

---

## 37. Database Security

Persistent state must not rely on a single unrestricted database identity shared by every component when narrower identities become practical.

Database credentials must be managed as secrets.

The application must validate authorization at the application boundary rather than assuming database reachability implies business authorization.

Sensitive information should not be persisted unless required for the workflow.

---

## 38. Message Security

Structured inter-agent messages are not trusted merely because they exist in the message store.

The receiver or orchestrator must validate relevant properties such as:

- sender identity,
- sender role,
- session,
- workflow state,
- expected message type,
- task or feature relationship,
- expiration where applicable.

A message claiming approval does not create approval unless it comes through the authorized approval mechanism.

---

## 39. Replay and Idempotency

Security-sensitive operations should be designed to tolerate duplicate delivery without duplicating side effects where practical.

Operations such as approvals, submissions, Git mutations, and external browser submissions should use identifiers or state checks that allow replay or duplicate attempts to be detected.

A retried message must not silently perform a sensitive action twice.

---

## 40. Workflow Authorization

Every security-sensitive action must be evaluated in the context of authoritative workflow state.

For example, a technically valid integration request must still be rejected when:

- the required review has not occurred,
- the requesting role lacks authority,
- the source branch is wrong,
- mandatory checks failed,
- required human approval is absent.

Authorization is therefore a function of identity, role, scope, state, policy, and approvals rather than a single boolean attached to a user or model.

---

## 41. Fail Closed for Required Controls

When a mandatory security or governance control cannot execute, the default behavior is to stop, block, or require explicit escalation rather than silently proceed.

Examples include:

- Policy Engine unavailable for a protected operation,
- required approval state unavailable,
- required validation cannot execute,
- browser-control ownership cannot be determined,
- repository state is ambiguous for a protected Git mutation.

Availability problems must not automatically downgrade security requirements.

---

## 42. Model Failure and Hallucination

Models may produce incorrect claims, invented identifiers, fabricated tool outcomes, or misunderstood instructions.

Deterministic components must validate security-critical identifiers and state rather than trusting model assertions.

The platform must never treat a model statement such as `the user approved this` or `tests passed` as authoritative without corresponding system evidence.

---

## 43. Model Selection and Security

Model capability does not alter role authorization.

Changing from a local model to a stronger hosted model must not automatically grant broader tools or permissions.

When externally hosted models are introduced, data exposure, privacy, retention, and provider trust must be evaluated before sending sensitive project or user information.

---

## 44. Data Minimization

Provide agents and tools with the minimum data necessary for the current task whenever practical.

Do not send an entire authenticated page, database record, browser profile, or repository when a bounded subset is sufficient.

Data minimization applies to:

- model context,
- tool parameters,
- MCP responses,
- logs,
- messages,
- screenshots,
- persistent evidence.

---

## 45. Personal and Sensitive User Data

Workflows may encounter personal or sensitive information while browsing or filling forms.

Such information must be handled only for the authorized workflow purpose and according to applicable project policy and law.

Do not persist personal data merely because it was visible to the browser.

Evidence collection must be designed to avoid unnecessary retention of sensitive page contents.

---

## 46. File Uploads

File upload is a sensitive browser capability because it can expose local information to an external service.

A browser tool must not be given unrestricted access to arbitrary local filesystem paths.

Upload operations should use explicitly authorized files or bounded upload staging areas.

External page content must not be allowed to select arbitrary local secrets or project files for upload.

---

## 47. Downloads

Downloaded files must be treated as untrusted content.

Downloads must not be automatically executed merely because a workflow obtained them.

Future download handling should use bounded storage locations, validation, and explicit processing rules appropriate to the file type and workflow.

---

## 48. Shell and Code Execution

Shell access and arbitrary code execution are high-impact capabilities.

Role policies must restrict them according to development responsibilities.

Untrusted web or tool content must never directly become a shell command without appropriate transformation, validation, and authorization.

Production browser workflows should prefer narrow actions over exposing arbitrary Playwright or shell execution to the model.

---

## 49. OpenCode Security Boundaries

OpenCode permissions and plugins are important enforcement layers but are not the only system security boundary.

Critical rules must also be represented in platform components such as the Policy Engine, controllers, quality gates, repository protections, and Human Gate as appropriate.

Disabling or bypassing an OpenCode plugin must not automatically make a prohibited business operation valid.

---

## 50. Security Testing

The project will progressively add security-focused tests, including tests for:

- agent role violations,
- protected-file modification attempts,
- unauthorized branch operations,
- missing human approval,
- malformed structured messages,
- stale or invalid browser-control leases,
- prompt-injection influenced tool requests,
- destination-policy violations,
- MCP authorization boundaries,
- secret redaction,
- replay of sensitive operations.

Security tests must be deterministic where practical.

---

## 51. Prompt-Injection Test Fixtures

The test suite should eventually contain benign synthetic fixtures representing malicious instruction patterns found in untrusted content.

Such fixtures are intended to verify that external instructions cannot gain authority or bypass deterministic checks.

Security tests must focus on defensive validation and must not introduce real credentials or sensitive production data into fixtures.

---

## 52. Incident Classification

Examples of events that should be treated as security incidents or security-relevant events include:

- exposed credentials,
- unauthorized production promotion,
- unauthorized repository mutation,
- agent privilege escalation,
- policy bypass,
- unauthorized external submission,
- sensitive data exfiltration,
- malicious or compromised MCP/tool behavior,
- loss of browser-control ownership integrity,
- audit tampering,
- execution of untrusted downloaded code.

Incident handling procedure will be expanded as the platform matures.

---

## 53. Security Incident Response

When a suspected security incident occurs:

1. stop or isolate the affected operation when safe to do so,
2. preserve relevant non-secret evidence,
3. prevent additional unauthorized actions,
4. revoke or rotate exposed credentials where applicable,
5. determine affected sessions, services, branches, or external systems,
6. correct the vulnerability through the governed process,
7. validate the correction,
8. document material architectural or policy lessons where appropriate.

Do not delete evidence merely to make the system appear clean.

---

## 54. Vulnerability Reporting

Do not disclose an unpatched security vulnerability through a normal public issue when doing so would unnecessarily expose users or systems to risk.

For this repository, use GitHub private vulnerability reporting when that feature is enabled.

If private vulnerability reporting is not enabled and no other private contact method is documented, the repository owner must establish an appropriate private reporting channel before soliciting external vulnerability reports.

Security reports should include enough information to assess the affected component, impact, and reproducibility without including real third-party credentials or unnecessary personal data.

---

## 55. Supported Versions

The project is currently in early development and does not yet declare stable released versions with independent security-support windows.

Until a release-support policy is established, security fixes target the actively governed development line and any production version explicitly designated as supported by project governance.

This section must be revised before the project claims stable public release support.

---

## 56. Security Exceptions

Security exceptions must be explicit, bounded, justified, and reviewable.

An exception must identify, as applicable:

- the control being relaxed,
- why the exception is necessary,
- the affected scope,
- compensating controls,
- the approving authority,
- expiration or review condition.

An agent cannot grant itself a security exception.

Production-critical exceptions require the human approval mandated by project governance.

---

## 57. Security Policy Changes

Material weakening of this security policy or its deterministic enforcement requires the applicable governance review and explicit human approval when required by the Project Charter.

Security rules must not be weakened solely to unblock failing implementation work.

Architecturally significant security decisions should be captured in ADRs.

---

## 58. Implementation Roadmap

This policy initially documents requirements that will be progressively enforced through later phases.

Expected enforcement mechanisms include:

```text
OpenCode permissions
OpenCode security plugins
protected-file rules
ESLint and architecture checks
secret scanning
security-focused Vitest suites
Policy Engine
Human Gate
Git Controller
Browser Controller
MCP wrappers
PostgreSQL authorization/state checks
CI security checks
GitHub branch protection
container/network restrictions
```

The absence of an implemented control today does not grant permission to violate the documented rule.

---

## 59. Initial Security Acceptance Baseline

Before the first governed multi-agent development milestone is considered complete, the project should be able to demonstrate at minimum that:

1. role-restricted operations can be denied deterministically,
2. protected governance cannot be casually modified by implementation agents,
3. branch-authority rules can be enforced,
4. required validation failure blocks integration,
5. human production approval cannot be fabricated by an agent,
6. workflow-critical state is stored outside model memory,
7. security-relevant decisions generate reviewable evidence.

Browser-specific security acceptance criteria will be added before interactive browser automation becomes an enabled production capability.

---

## 60. Security Definition of Compliance

A security-compliant operation must satisfy all applicable conditions for:

```text
identity
role
scope
workflow state
policy
required validation
required approvals
tool restrictions
destination restrictions
data-handling requirements
```

A successful technical outcome does not excuse a security-policy violation.

When safe execution and task completion conflict, safe execution takes precedence.

<!-- adversarial governance fixture -->

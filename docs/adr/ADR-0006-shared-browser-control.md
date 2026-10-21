# ADR-0006: Shared Browser Control

- **Status:** Accepted
- **Date:** 2026-10-20
- **Decision owners:** Human project owner during bootstrap governance
- **Related governance:** `docs/architecture/PROJECT_CHARTER.md`, `AGENTS.md`, `SECURITY.md`, `ADR-0005`
- **Supersedes:** None
- **Superseded by:** None

## Context and Problem Statement

The platform must support workflows in which an AI-guided automation system and a human operator interact with the same browser session.

These workflows may include research, navigation, form completion, authenticated sessions, multi-step web interactions, waiting, downloads, uploads, and situations that require the human to take control temporarily before automation can continue.

Uncontrolled simultaneous interaction would create race conditions and ambiguity. The automation also needs a structured way to perceive the current page before acting. Browser content is untrusted and may contain sensitive information or prompt-injection attempts, so browser observation must not become authority to bypass project policy.

The browser architecture must therefore define session persistence, control ownership, human handoff, perception, stale-state handling, policy evaluation, action verification, and the relationship among MCP tools, the Policy Engine, browser-control components, and Playwright.

This decision is architecturally significant because it establishes a core execution boundary for one of the platform's primary product capabilities.

## Decision Drivers

- Let the human and automation use the same browser session without uncontrolled simultaneous writes.
- Preserve authenticated session continuity when appropriate without exposing raw credentials to models.
- Allow explicit handoff for login and other human-required steps.
- Require sufficiently current browser observation before dependent actions.
- Prefer structured page representations when they are sufficient for model reasoning.
- Preserve screenshots as visual evidence or fallback perception without requiring vision for every action.
- Keep browser mutations behind project policy and risk controls.
- Treat browser content as untrusted data.
- Support interruption, timeout, recovery, and audit.
- Avoid coupling the product permanently to a raw unrestricted browser MCP interface.
- Keep web research distinct from interactive browser control.

## Considered Options

### Option A: Separate human and automation browsers

Use independent sessions for the human and agent and synchronize state indirectly.

### Option B: Shared persistent browser with explicit control lease

Use one governed persistent browser session with explicit ownership and transfer between human and agent.

### Option C: Shared browser with simultaneous interaction

Allow the human and automation to act concurrently and resolve conflicts opportunistically.

### Option D: Headless autonomous browser only

Use an automation-only browser and treat human-required steps as external workflows disconnected from the browser session.

## Decision Outcome

> We will use a persistent shared browser runtime with explicit control ownership. The human and agent may interact with the same governed browser session, but only the current control owner may perform write interactions. Browser actions will pass through policy and a Browser Controller rather than giving production workflows unrestricted direct browser execution.

### Browser control ownership

Browser write control must conceptually have one owner at a time:

```text
human
agent
none
```

Control will be represented through a lease or equivalent authoritative state containing enough information to identify the browser session, actor, scope, acquisition time, and expiration where applicable.

A conceptual lease can represent:

```text
lease_id
browser_session_id
owner_type
owner_id
tab_id
acquired_at
expires_at
status
```

The exact schema will be defined during contract implementation.

### Exclusive write control

The system must prevent uncontrolled concurrent human and agent write interaction.

When the agent owns the lease, the human may observe through the product interface and must be able to interrupt or request control according to policy.

When the human owns the lease, automated write operations must stop until control is explicitly returned or a governed lease transition occurs.

Read-only observation may be permitted while another actor owns write control when policy considers that safe.

### Human interruption

The human operator must have a visible mechanism to stop or take control from automation.

An emergency interruption must cause pending automated browser actions to stop or fail safely as soon as practical.

The automation must not silently reacquire control after a human interruption unless the workflow defines and records the applicable resume transition.

### Authentication handoff

When login, MFA, CAPTCHA, human verification, consent, or another step requires human participation, automation must release or transfer browser control and enter an explicit waiting state.

A representative flow is:

```text
agent owns control
      |
      v
human-required authentication detected
      |
      v
agent releases control
      |
      v
WAITING_FOR_LOGIN / WAITING_FOR_BROWSER_CONTROL
      |
      v
human completes interaction
      |
      v
human explicitly confirms continuation
      |
      v
browser is observed again
      |
      v
policy allows agent reacquisition
      |
      v
agent continues
```

Elapsed time alone must not be interpreted as successful authentication or permission to resume.

The system must not be designed to bypass CAPTCHA, authentication controls, or equivalent access protections.

### Re-observation after human interaction

After material human interaction, the automation must obtain sufficiently fresh browser state before performing an action that depends on the page.

The agent must not assume that the page remains in the state it observed before handing control to the human.

### Browser perception

The Browser Runtime must support multiple perception channels where appropriate:

```text
accessibility snapshot
structured DOM information
technical browser state
screenshots / visual evidence
```

Structured accessibility information is the preferred first representation when it contains sufficient information for the task.

Structured DOM inspection may supplement accessibility information when required for task-relevant state that is not represented adequately in the accessibility view.

Technical state may include information such as current URL, page title, tabs, dialogs, navigation state, console errors, downloads, or other browser events needed by an authorized workflow.

Screenshots may be captured for evidence, human inspection, or future visual-model processing when structured information is insufficient.

Perception data must be minimized according to task need and security policy.

### Stale element and stale observation handling

References derived from a browser observation are not permanent identifiers.

When the page changes and an element reference is no longer valid, the automation must re-observe rather than guess a replacement target for a sensitive operation.

For important actions, the Browser Controller may require a recent observation identifier or equivalent state correlation so an action can be linked to the state on which it was proposed.

### Action lifecycle

Browser mutation should follow a governed lifecycle conceptually equivalent to:

```text
observe
  -> identify target/action
  -> classify requested action
  -> evaluate policy
  -> obtain human approval if required
  -> verify control lease
  -> execute
  -> observe/verify resulting state
  -> record bounded evidence
```

Not every low-risk action requires human approval, but every action remains subject to applicable policy.

### Risk classification

Browser actions must eventually have policy-relevant risk classification.

The model should distinguish concepts such as:

```text
observation
navigation
reversible form editing
external form submission
file download
file upload
account modification
credential-related action
financial or contractual action
administrative action
```

The final taxonomy and approval matrix will be defined during policy/browser implementation.

Permission for a low-risk capability must not automatically authorize a higher-risk capability.

### Browser Controller

The Browser Controller will be the deterministic execution boundary for governed browser effects.

Its responsibilities will include, as applicable:

```text
validate control ownership
evaluate or require policy decision
validate target session/tab
apply destination restrictions
perform bounded browser action
coordinate Human Gate states
record audit evidence
return post-action state or verification
```

It must not trust a model's assertion that it owns control or that human approval occurred.

### MCP boundary

The agent-facing Browser Control MCP will expose focused browser capabilities.

The intended path is:

```text
Agent
  |
Browser Control MCP
  |
Policy / Human Gate
  |
Browser Controller
  |
Playwright/browser runtime
  |
Shared browser session
```

A production workflow must not receive unrestricted underlying browser code execution merely because the lower-level automation technology supports it.

Any escape hatch for arbitrary browser code, if retained for development or diagnostics, must be separately restricted and must not bypass normal production policy.

### Playwright foundation

Playwright is the initial browser automation foundation.

Playwright MCP may be used during development and as a reference/integration building block because it provides structured accessibility snapshots and browser interactions through MCP.

The platform-specific Browser Controller and policy wrapper remain necessary because raw browser capability does not encode the project's human-control, risk, audit, and authorization rules.

### Session persistence

The Browser Runtime must support persistent browser-session state where workflows require continuity.

Session persistence may include browser-managed state such as authenticated session data, but raw credential material must not be copied into ordinary model context.

Persistence policy must account for expiration, revocation, cleanup, and sensitive-data handling.

### Research versus interactive browser control

Web Research and Browser Control remain separate capabilities.

Prefer a research/fetch capability when a task only requires information retrieval and does not require interactive browser state.

Use interactive browser control when the workflow requires live session state, dynamic interaction, authenticated navigation, or other browser-specific behavior.

### Destination control

Browser automation must support policy over external destinations.

Redirects, popups, new tabs, downloads, and external links remain subject to policy. A page must not expand workflow authority to arbitrary unrelated domains merely by instructing the model to navigate there.

### Pacing and retries

The Browser Runtime must support bounded waits, timeouts, retries, and backoff appropriate to the workflow.

Retries must not create uncontrolled repeated submissions or duplicate sensitive side effects.

The system must respect legitimate service rate limits and anti-abuse controls rather than intentionally bypass them.

## Consequences

### Positive

- Human and agent can collaborate in the same browser session without uncontrolled simultaneous writes.
- Login and other human-required steps can preserve browser continuity.
- Structured accessibility information reduces dependence on screenshots for ordinary interactions.
- Explicit leases make control state inspectable and enforceable.
- Re-observation after human intervention reduces stale-state assumptions.
- Browser actions become policy-aware capabilities rather than unconstrained model commands.
- A Browser Controller provides a stable project boundary even if lower-level browser tooling evolves.
- Interactive browser control and web research can be optimized independently.
- Audit records can correlate actions with browser sessions, actors, policy decisions, and observations.

### Negative / Trade-offs

- Lease management adds workflow state and failure modes.
- Exclusive write control can reduce throughput compared with simultaneous interaction.
- Persistent sessions create sensitive-state lifecycle and cleanup responsibilities.
- Accessibility representations can omit task-relevant visual or custom-widget information, requiring supplementary perception.
- Screenshots and DOM data may contain personal or sensitive information and require minimization/redaction.
- Re-observation introduces additional browser/tool calls and latency.
- Wrapping Playwright/MCP behind project policy requires more implementation than exposing the raw automation interface directly.

### Neutral / Follow-up

- Define browser-session and control-lease contracts.
- Define the browser action risk taxonomy and Human Gate approval matrix.
- Implement lease acquisition, release, interruption, expiration, and recovery tests.
- Implement perception adapters for accessibility, bounded DOM inspection, technical state, and screenshots.
- Define evidence retention and screenshot redaction policy.
- Define allowed destination/domain policy for site-specific workflows.
- Implement idempotency/safety for retries of externally visible actions.
- Add Playwright-based integration and E2E tests after the Browser Runtime exists.
- Determine how the visible browser shell integrates with the user interface and local desktop environment.

## Validation and Confirmation

The implementation must eventually demonstrate at least:

- no two actors can simultaneously hold the same exclusive browser write lease,
- agent write actions fail when the human owns browser control,
- human interruption revokes or blocks subsequent automated write actions as designed,
- an expired or invalid lease cannot authorize a browser mutation,
- login handoff waits for explicit human continuation rather than elapsed time,
- the browser is re-observed after material human interaction before dependent automation resumes,
- stale accessibility references cause re-observation rather than unsafe target guessing,
- policy-denied browser capabilities cannot be reproduced through an unrestricted alternate browser path,
- redirects and new external destinations remain subject to destination policy,
- sensitive action retries do not silently duplicate side effects,
- audit evidence identifies the relevant session, actor, action category, policy result, and execution result without storing raw secrets.

Browser-specific security tests must include benign synthetic prompt-injection content that attempts to redirect the agent to unauthorized capabilities or destinations.

## Security Considerations

Browser content is untrusted data and may contain prompt-injection instructions. Content visible in the DOM, accessibility tree, screenshot, downloaded file, or page text must not alter project authority.

Authentication cookies, tokens, passwords, MFA secrets, and similar values must not become ordinary LLM context.

File upload is sensitive because it can disclose local data. Upload tools must use explicitly authorized files or bounded staging locations rather than unrestricted local filesystem paths.

Downloaded files are untrusted and must not be automatically executed.

The Browser Controller is a confused-deputy risk because it can possess capabilities that the requesting model does not. It must validate policy, lease state, target session, and other applicable context before acting.

Screenshots, DOM extracts, and accessibility snapshots may contain personal data. Persistent evidence must follow minimization and retention policy.

Arbitrary Playwright code execution is a high-impact capability and must not be exposed to ordinary production automation without a separately approved policy.

## Operational Considerations

The initial local execution profile supports one interactive browser at a time.

The browser should be visible when human handoff or observation is required.

Browser-session state must survive an agent handoff or context refresh when the workflow remains active, but session cleanup must occur after completion, expiration, or explicit revocation according to policy.

The UI should expose at least:

```text
browser session status
current control owner
pending handoff/approval
current page identity where safe
stop/take-control action
recent relevant action status
```

Browser actions should use correlation identifiers so audit records can reconstruct observe -> authorize -> execute -> verify sequences.

## Related Decisions

- ADR-0005 defines policy enforcement and defense in depth used for browser capabilities.
- ADR-0003 defines development-agent authority; development roles do not automatically grant runtime browser authority.
- `SECURITY.md` defines prompt-injection, secret, upload/download, logging, and external-content requirements that apply to browser automation.

## Notes

Playwright MCP's accessibility-snapshot model is a strong fit for the initial text-first local model strategy, but this ADR intentionally defines a project Browser Runtime abstraction instead of making the product architecture identical to one MCP server's current tool surface.

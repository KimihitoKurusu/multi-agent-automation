# ADR-0001: Primary Language and Runtime

- **Status:** Accepted
- **Date:** 2026-10-20
- **Decision owners:** Human project owner during bootstrap governance
- **Related governance:** `docs/architecture/PROJECT_CHARTER.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`
- **Supersedes:** None
- **Superseded by:** None

## Context and Problem Statement

The platform requires a primary implementation language and runtime for its core services, agent orchestration, OpenCode integration, MCP servers, policy enforcement, browser-control infrastructure, user-facing services, and shared packages.

The development workstation currently provides Node.js 24.19.0, Python 3.14.7, and Java 21 LTS. The project is already bootstrapped as a pnpm workspace with TypeScript compiler configuration and ESM package semantics.

The architecture must minimize unnecessary language fragmentation while retaining the ability to use a secondary ecosystem when a specialized capability provides a material advantage.

The decision is architecturally significant because it establishes the default implementation ecosystem, package model, compiler/tooling baseline, inter-package conventions, contributor expectations, and future quality gates across most of the repository.

OpenCode project plugins are supported as JavaScript or TypeScript modules, which aligns the agent-development harness with the same ecosystem used by the proposed application core.

## Decision Drivers

- Maintain one primary language across the majority of application and agent infrastructure.
- Align naturally with OpenCode plugin development.
- Support MCP servers and tool integrations without requiring a separate primary runtime.
- Provide strong static typing for workflow state, agent contracts, policy decisions, messages, and tool interfaces.
- Fit the existing Node.js and pnpm monorepo bootstrap.
- Support modern ESM semantics.
- Reduce context switching and duplicated tooling across development agents.
- Preserve access to Python where its ecosystem provides a clear specialized advantage.
- Avoid introducing Java into the initial application runtime without a concrete requirement.
- Remain practical on the local development workstation.

## Considered Options

### Option A: TypeScript with Node.js as the primary stack

Use TypeScript for the application core and Node.js as its primary runtime, while permitting bounded secondary-language components when explicitly justified.

### Option B: Python as the primary stack

Use Python as the principal language for orchestration, MCP services, policy logic, browser infrastructure, and application services.

### Option C: Java as the primary stack

Use Java 21 as the principal runtime and integrate AI/browser tooling around a JVM-based core.

### Option D: Polyglot core without a designated primary language

Allow TypeScript, Python, and Java to be selected independently per component from the beginning.

## Decision Outcome

> We will use TypeScript as the primary implementation language and Node.js 24.x as the initial primary application runtime for the Multi-Agent Automation Platform.

The root package uses ESM semantics and the TypeScript baseline will target the Node.js runtime used by the project.

The initial TypeScript module strategy remains NodeNext while it is the configured and validated repository baseline. Changes to the module strategy require normal governed review and, when architecturally significant, an ADR update or superseding ADR.

Python is an approved secondary technology for specialized capabilities when its ecosystem provides a clear advantage and the boundary with the TypeScript core is explicit and testable.

Python is not a second default implementation language. A contributor or agent must not choose Python for ordinary core implementation solely by preference.

Java 21 remains available on the development workstation but is not part of the initial application runtime. Introducing a JVM service or Java application component requires a concrete justified need and architectural review.

The primary runtime baseline is Node.js 24.x rather than an exact patch release so compatible Node.js 24 patch updates can be adopted through normal dependency/runtime maintenance. A future move to another Node.js major version requires explicit compatibility validation and may require a new architectural decision if it materially affects the platform.

## Consequences

### Positive

- Most application code, contracts, tools, services, and OpenCode integration can share one language and ecosystem.
- Strict TypeScript can provide compile-time feedback for workflow contracts, policy data, messages, and component interfaces.
- The repository can share TypeScript quality tooling across multiple workspace packages.
- OpenCode plugin development aligns directly with the primary language because OpenCode supports JavaScript and TypeScript project plugins.
- Node.js matches the current monorepo and pnpm setup without introducing another primary build system.
- Specialized Python functionality remains possible without making the platform core polyglot by default.
- Agents need less cross-language context for ordinary feature development.

### Negative / Trade-offs

- Python-first libraries may require a separate process, service, or integration boundary when they provide capabilities not reasonably available in the Node.js ecosystem.
- Java libraries and JVM tooling do not integrate directly into the core runtime and would require an explicit service or interoperability boundary if later adopted.
- A Node.js major-version baseline requires active compatibility management as the ecosystem evolves.
- NodeNext and ESM semantics require contributors to follow Node-compatible module-resolution behavior rather than relying on CommonJS assumptions.
- TypeScript static types do not replace runtime validation for untrusted data, external tool results, database records, MCP inputs, or inter-process messages.

### Neutral / Follow-up

- The quality-gate phase must add linting, formatting, tests, and TypeScript enforcement around this baseline.
- Workspace packages should inherit from the shared TypeScript configuration unless a bounded component has an approved reason not to.
- Runtime validation for structured contracts must be selected separately; TypeScript types alone are insufficient at trust boundaries.
- Any Python service introduced later must define its API/IPC contract, dependency management, supported Python runtime, tests, and deployment boundary explicitly.
- A future frontend application may use TypeScript with bundler-specific compilation settings while the Node.js backend/core retains Node-oriented settings. Such specialized package configuration must remain compatible with this decision's TypeScript-first direction.

## Validation and Confirmation

Compliance can initially be confirmed through repository configuration and deterministic checks.

The baseline should be observable through:

- root `package.json` declaring the supported Node.js 24 range,
- root `package.json` using ESM package semantics,
- `tsconfig.base.json` defining the shared strict TypeScript baseline,
- `pnpm typecheck` succeeding,
- application and core workspace packages using TypeScript by default,
- review of any newly introduced Python or Java runtime component for an explicit architectural justification.

The quality-gate phase should automate relevant checks so ordinary implementation work cannot silently weaken the shared TypeScript baseline.

The repository currently records Node.js 24 support as:

```text
>=24 <25
```

and uses an ES2024/Node-oriented TypeScript baseline appropriate to the current environment.

## Security Considerations

Using TypeScript does not create a security boundary. Static typing cannot prove that untrusted runtime data is safe or authorized.

External input, MCP data, browser content, database records, human input, and inter-component messages must still receive runtime validation and policy evaluation where required.

Keeping one primary ecosystem reduces the number of default dependency and build chains that require security maintenance, but npm/pnpm packages remain supply-chain dependencies and must be governed accordingly.

Secondary Python components must not receive broader secrets, filesystem access, network access, or model authority merely because they run outside the Node.js process.

The OpenCode plugin ecosystem must remain subject to the security rules in `SECURITY.md`; implementation in TypeScript does not make a plugin trusted automatically.

## Operational Considerations

Node.js 24.x is the initial runtime baseline for core local development and future Node-based services.

The project must verify Node.js compatibility in automated validation as CI and deployment are introduced.

Node.js patch updates within the supported 24.x range should be tested before being treated as the active development baseline.

Python components, when justified, should preferably have explicit runtime isolation and dependency manifests rather than relying implicitly on whatever Python happens to be installed on the host.

Java does not need to be removed from the workstation; it simply remains outside the supported application runtime until an accepted architectural need introduces it.

Container images introduced later should pin an appropriate runtime baseline instead of relying on unspecified host versions.

## Related Decisions

- ADR-0002 will define the monorepo and package-management strategy.
- ADR-0003 will define the multi-agent hierarchy whose contracts and harness are primarily implemented in this stack.
- ADR-0005 will define deterministic policy enforcement and defense in depth across the runtime.

## Notes

The initial TypeScript configuration was established before this ADR during repository bootstrap. This ADR records and governs that existing baseline rather than pretending the decision originated after implementation.

Current TypeScript and Node.js guidance should be re-evaluated when changing Node.js major versions or making material changes to module-resolution strategy.

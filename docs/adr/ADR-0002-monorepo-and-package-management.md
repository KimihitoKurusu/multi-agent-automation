# ADR-0002: Monorepo and Package Management

- **Status:** Accepted
- **Date:** 2026-10-20
- **Decision owners:** Human project owner during bootstrap governance
- **Related governance:** `docs/architecture/PROJECT_CHARTER.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ADR-0001`
- **Supersedes:** None
- **Superseded by:** None

## Context and Problem Statement

The Multi-Agent Automation Platform will contain multiple cooperating applications, reusable packages, MCP servers, tests, governance assets, workflow definitions, and infrastructure configuration.

These components must evolve under one architecture and share contracts for agent identity, workflow state, policy decisions, messages, browser control, human approvals, auditing, and testing.

The repository has already been bootstrapped as a pnpm workspace with a root `package.json`, `pnpm-workspace.yaml`, shared TypeScript configuration, and a committed `pnpm-lock.yaml`.

The project therefore needs to formalize whether these components remain in one repository, how JavaScript/TypeScript dependencies are managed, how internal packages are referenced, and how top-level project areas are separated.

This decision is architecturally significant because repository topology influences dependency boundaries, quality gates, agent task scope, CI behavior, atomic changes across contracts and implementations, and maintainability of the platform as the number of components grows.

## Decision Drivers

- Keep cross-cutting contracts and their consumers versioned together during the early and middle stages of platform development.
- Support atomic changes that update a shared contract and its affected applications or MCP servers in one governed contribution.
- Provide one dependency installation and lockfile strategy for the primary TypeScript/Node.js ecosystem.
- Allow shared TypeScript configuration and future quality gates to be applied consistently.
- Make component boundaries visible without requiring separate repositories for every service or package.
- Provide clear task scopes for Developers and review scopes for Team Leaders and the Architect.
- Distinguish deployable applications, reusable libraries, and MCP capability servers.
- Avoid accidental resolution of intended internal dependencies to unrelated registry packages.
- Keep the initial local development workflow manageable on the available workstation.
- Avoid adding a monorepo orchestration framework before demonstrated build or dependency-graph complexity requires one.

## Considered Options

### Option A: pnpm monorepo with explicit workspace areas

Maintain one Git repository using pnpm workspaces, a single committed pnpm lockfile, shared root tooling, and explicit top-level areas for applications, reusable packages, and MCP servers.

### Option B: Multiple repositories

Create separate Git repositories for the orchestrator, browser runtime, policy engine, MCP servers, user interface, and other major components.

### Option C: Single Node.js package without workspace boundaries

Keep all TypeScript code under one root package without separate workspace packages.

### Option D: Monorepo with an additional orchestration framework from the start

Use pnpm workspaces together with a dedicated monorepo build/orchestration layer before the repository has enough packages to demonstrate a need for that additional system.

## Decision Outcome

> We will maintain the Multi-Agent Automation Platform as a single Git monorepo and use pnpm workspaces as the package-management foundation for its TypeScript/Node.js components.

The root `pnpm-workspace.yaml` defines the workspace membership.

The initial package-bearing top-level areas are:

```text
apps/*
packages/*
mcp/*
```

Their intended responsibilities are:

```text
apps/
  deployable or directly executable platform applications and services

packages/
  reusable libraries, contracts, infrastructure abstractions, and shared capabilities

mcp/
  MCP servers or MCP-specific capability packages exposed through the Model Context Protocol
```

Other top-level directories such as `docs/`, `quality/`, `tests/`, `infra/`, `agents/`, `workflows/`, and `scripts/` may contain project assets without automatically becoming independent workspace packages.

The root `pnpm-lock.yaml` is the authoritative lockfile for the Node.js workspace unless a future accepted architectural decision introduces a justified exception.

When one workspace package is intended to depend on another package in this same repository, the dependency should use pnpm's `workspace:` protocol. The preferred unconstrained internal-development form is:

```text
workspace:*
```

unless a future package publication/versioning strategy requires an explicit workspace-compatible range.

We will not introduce an additional monorepo orchestration framework such as a dedicated build graph/cache system until repository scale or measured build/test performance demonstrates a concrete need.

## Consequences

### Positive

- Shared contracts can evolve atomically with their consumers during governed changes.
- One repository provides a unified location for architecture, agent policy, security policy, source code, MCP servers, tests, and infrastructure definitions.
- pnpm workspace support provides a direct mechanism for managing multiple packages in one repository.
- A single lockfile makes Node.js dependency changes visible in one review surface.
- Shared TypeScript and future lint/test configuration can be maintained centrally.
- The `apps/`, `packages/`, and `mcp/` distinction communicates architectural intent without requiring separate repositories.
- Developer tasks can be scoped to explicit packages or package groups.
- `workspace:` dependencies can make intended local package resolution explicit.
- The team avoids introducing an additional monorepo coordination tool before its operational value has been demonstrated.

### Negative / Trade-offs

- Repository size and validation time will increase as applications, packages, browser tests, and MCP servers accumulate.
- Poorly governed workspace dependencies could create excessive coupling between packages.
- A single repository gives contributors and automation visibility into more project areas, so authorization must still be enforced by task scope and policy rather than relying on repository separation.
- A shared lockfile means dependency updates can affect multiple workspace packages and require broader validation.
- Some components may eventually need independent release or deployment cadences that require additional tooling or a future architectural adjustment.
- Monorepo convenience does not automatically enforce allowed dependency direction; explicit architecture rules will still be required.

### Neutral / Follow-up

- Each actual workspace package must receive its own `package.json` when that component is created.
- Workspace package naming conventions will be established when the first reusable packages are implemented.
- Architecture dependency rules must later constrain which workspace areas may depend on which others.
- The quality-gate phase should provide repository-wide commands for type checking, linting, testing, and architecture validation.
- CI should eventually select efficient validation scopes without permitting required cross-package validation to be skipped.
- Package publication is not an initial requirement. If external publication becomes necessary, versioning and release policy require explicit design.

## Validation and Confirmation

Compliance can initially be confirmed through repository configuration and structure.

The baseline should be observable through:

- `pnpm-workspace.yaml` existing at the repository root,
- workspace membership including `apps/*`, `packages/*`, and `mcp/*`,
- a committed root `pnpm-lock.yaml`,
- `pnpm install` operating from the repository root,
- newly created TypeScript workspace packages using the governed root toolchain,
- intended local workspace dependencies using `workspace:` references,
- absence of an unapproved second Node.js package manager lockfile.

Future automated validation should detect conditions such as:

- unexpected `package-lock.json` or `yarn.lock` files,
- workspace packages outside approved package-bearing areas without architectural approval,
- prohibited cross-package dependency directions,
- local package dependencies that should use `workspace:` but incorrectly resolve through an external registry.

## Security Considerations

A monorepo is not an authorization boundary.

An agent that can read the repository must not infer permission to modify every workspace package. Developer write access remains bounded by task scope and deterministic policy.

The root lockfile and package manifests are supply-chain sensitive. Unexpected changes must be reviewed, and dependency installation must remain subject to the security requirements in `SECURITY.md`.

Using `workspace:` for intended internal dependencies reduces ambiguity about whether a dependency should resolve to a local workspace package, but it does not validate the trustworthiness of that package's code.

MCP servers under `mcp/` remain privileged integration surfaces and do not become trusted merely because they are stored in the same repository.

Future CI credentials, package-registry credentials, deployment tokens, and other secrets must remain outside committed workspace configuration.

## Operational Considerations

The repository root remains the normal entry point for Node.js dependency installation and cross-workspace development commands.

The initial local workflow uses:

```text
pnpm install
pnpm typecheck
```

Additional root scripts will be introduced as quality tooling is implemented.

The architecture should avoid requiring every developer command to start every application or MCP server. Package-level tests and services should remain independently executable where practical.

As the workspace grows, build/test duration and local memory usage must be measured before adding concurrency or caching systems.

If a future component requires a non-Node runtime, such as an approved Python service, it may live in the monorepo while maintaining its own bounded dependency manifest and runtime boundary. pnpm remains the package manager for the TypeScript/Node.js workspace rather than a universal dependency manager for every possible language.

## Related Decisions

- ADR-0001 establishes TypeScript and Node.js as the primary language/runtime ecosystem.
- ADR-0003 will define the multi-agent hierarchy that operates on this repository under bounded task scopes.
- ADR-0005 will define deterministic enforcement, including future dependency and protected-file controls.

## Notes

The pnpm workspace configuration existed before this ADR as part of repository bootstrap. This ADR records the rationale and constraints for that existing baseline.

The decision intentionally does not adopt an additional monorepo orchestration framework yet. Not selecting one now is not a permanent prohibition; introducing one later should be based on measured need and governed architectural review.

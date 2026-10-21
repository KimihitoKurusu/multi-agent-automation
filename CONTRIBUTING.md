# Multi-Agent Automation Platform - Contribution Guide

## 1. Purpose

This document defines how changes are prepared, validated, reviewed, integrated, and promoted in the Multi-Agent Automation Platform repository.

It applies to contributions produced by humans and by governed AI agents.

The purpose of this workflow is not only to produce working code. It is to preserve a repository history and delivery process that are reviewable, reproducible, and compatible with the authority boundaries defined by the Project Charter and `AGENTS.md`.

---

## 2. Governing Documents

Contributors must follow the project governance defined by:

1. `docs/architecture/PROJECT_CHARTER.md`
2. accepted Architecture Decision Records under `docs/adr/`
3. `AGENTS.md`
4. `SECURITY.md`
5. quality policies under `quality/`
6. feature and task specifications

When two applicable rules appear to conflict, do not silently select the easier rule. Stop the affected operation and escalate through the applicable governance path.

---

## 3. Contribution Principles

Every contribution should satisfy the following principles:

- keep the change bounded to an explicit purpose,
- understand the affected architecture before editing,
- avoid unrelated refactoring,
- add or update tests when behavior changes,
- validate before requesting review,
- preserve evidence of required checks,
- report known limitations and unresolved risks,
- do not weaken governance to make a change pass,
- do not commit secrets or sensitive authentication data,
- do not mix independent concerns into one change when they can reasonably be reviewed separately.

A change being functionally correct does not automatically make its development path compliant.

---

## 4. Repository Baseline

The initial development baseline is:

```text
Node.js: 24.x
Package manager: pnpm
Primary language: TypeScript
Module model: ESM / NodeNext
Production branch: main
Integration branch: test
```

The root `package.json`, `.npmrc`, TypeScript configuration, and accepted ADRs are authoritative for exact configured requirements.

Do not change runtime or dependency-management baselines casually. Architecturally significant changes require the appropriate architecture decision process.

---

## 5. Installation

Install repository dependencies from the repository root with:

```text
pnpm install
```

The committed lockfile must be respected.

Do not delete or regenerate the lockfile merely to resolve an unrelated problem.

A dependency change that legitimately modifies the lockfile must include that lockfile change in the same contribution.

---

## 6. Workspace Dependencies

Internal packages in the monorepo should use explicit workspace dependencies when they are intended to resolve to another package in this repository.

The preferred form is:

```text
workspace:*
```

unless an accepted package/versioning strategy requires a different workspace range.

This prevents an internal dependency from silently resolving to an unrelated registry package when local resolution is required.

---

## 7. Branch Model

The governed branch hierarchy is:

```text
main
  ^
test
  ^
lider_<feature>
  ^
dev_<feature>_<task>
```

### `main`

`main` is the production branch.

Changes must not be promoted to `main` without the explicit human approval required by project governance.

### `test`

`test` is the integration branch governed by the Architect workflow.

Feature work must not bypass its required review chain before reaching `test`.

### Team Leader branches

A Team Leader feature branch follows:

```text
lider_<feature>
```

It is used to integrate Developer work that the Team Leader has approved for the assigned feature.

### Developer branches

A Developer task branch follows:

```text
dev_<feature>_<task>
```

It contains implementation work for a bounded task assigned by the relevant Team Leader.

---

## 8. Branch Naming Rules

Until automated branch-name validation is introduced, use these conventions manually:

- lowercase names,
- ASCII letters and digits,
- hyphens inside feature or task tokens when needed,
- no spaces,
- no ambiguous generic names such as `dev_fix`, `leader_work`, or `test2`.

Examples:

```text
lider_policy-engine
dev_policy-engine_rule-evaluator
dev_browser-runtime_control-lease
```

The exact branch-name regex will be established by the quality-gate implementation.

---

## 9. Creating a Feature Branch

A governed Team Leader branch must be created from the current authorized `test` baseline unless the workflow explicitly records another approved base.

Conceptually:

```text
test
  -> lider_<feature>
```

Before branch creation, verify that the working tree is clean and the local integration baseline is current according to the applicable workflow.

When the Git Controller is implemented, critical branch operations should move behind that controller rather than remain unrestricted shell operations.

---

## 10. Creating a Developer Branch

A Developer branch must be created from the authorized Team Leader branch for its feature.

Conceptually:

```text
lider_<feature>
  -> dev_<feature>_<task>
```

A Developer must not create its implementation branch directly from `main` as a shortcut around the governed hierarchy.

A Developer must not use an unrelated Developer branch as the base for a new independent task unless the Team Leader explicitly makes that dependency part of the work plan.

---

## 11. Working Tree Discipline

Before beginning a task, inspect repository state.

At minimum, determine:

```text
current branch
working-tree cleanliness
expected task scope
relevant governing documents
```

Do not begin unrelated work on top of unexplained local modifications.

If unexpected modifications are present, determine their ownership before changing, removing, staging, or committing them.

Never use destructive cleanup merely to make the working tree look clean when the ownership of existing work is unknown.

---

## 12. Task Scope

Every implementation contribution must have a bounded purpose.

A task may authorize:

- specific files,
- specific directories,
- a package,
- an interface,
- a narrowly described cross-package change.

If implementation discovers that a required change falls outside the authorized task scope, stop expanding the change and request a scope decision from the applicable Team Leader.

Do not perform opportunistic refactors unrelated to the task.

---

## 13. Protected Files

Some repository assets will be designated as protected governance files.

Expected protected categories include:

- `docs/architecture/PROJECT_CHARTER.md`,
- `AGENTS.md`,
- accepted ADRs,
- security policy,
- quality thresholds,
- protected-file definitions,
- role permissions,
- policy-engine rules,
- production-promotion controls.

The authoritative protected-file configuration will be implemented later under the quality and policy layers.

Until deterministic enforcement exists, treat these categories as governance-sensitive and obtain the required approval before materially weakening them.

---

## 14. Dependency Changes

Do not add a dependency solely because it is familiar or convenient.

Before adding a dependency, consider:

- whether the platform already provides the capability,
- whether a workspace package already provides it,
- maintenance and security implications,
- runtime compatibility,
- package size and transitive dependencies,
- whether the dependency changes an architectural boundary.

Architecturally significant dependency choices should be reviewed by the Architect and may require an ADR.

Dependency versions must follow the repository's package-management policy.

---

## 15. Source Code Expectations

Production code should:

- use TypeScript unless an approved exception applies,
- preserve strict type checking,
- expose narrow interfaces,
- avoid hidden cross-package coupling,
- avoid duplicating policy logic across callers,
- keep deterministic authorization outside model prompts,
- separate domain logic from infrastructure where practical,
- avoid logging secrets,
- make failure states explicit,
- remain testable without requiring unrestricted external systems.

The detailed architecture rules will become progressively executable through linting, dependency rules, tests, and policy enforcement.

---

## 16. TypeScript Policy

The root TypeScript baseline is intentionally strict.

A contribution must not solve implementation errors by weakening compiler rules such as strictness or indexed-access safety without an approved architectural reason.

Run the repository type check with:

```text
pnpm typecheck
```

A mandatory type-check failure blocks completion.

---

## 17. Testing Expectations

Behavioral changes require appropriate tests where the project has an applicable test layer.

The project will distinguish among:

```text
unit tests
contract tests
integration tests
end-to-end tests
architecture tests
security/policy tests
```

Not every change requires every category.

The assigned task and repository policy determine the required validation.

Testing must verify meaningful behavior, not merely execute lines of code to satisfy a metric.

Do not delete, skip, loosen, or rewrite a legitimate failing test merely to make a change appear valid.

---

## 18. Quality Gates

The repository will progressively enforce checks such as:

```text
format
lint
typecheck
unit tests
contract tests
integration tests
architecture tests
secret scanning
protected-file validation
branch-name validation
commit-message validation
```

A required check returning a non-zero exit code is a failure.

Do not reinterpret a failed mandatory check as successful because the generated output appears acceptable.

When a quality tool itself is broken, report and correct the infrastructure problem through the governed workflow rather than bypassing the gate.

---

## 19. Local Validation Before Review

Before requesting review, the contributor must run all validations required by the task and the currently implemented repository policy.

At the current bootstrap stage, the minimum repository validation is:

```text
pnpm typecheck
```

As additional quality tooling is introduced, this document and executable scripts will evolve so contributors have a single documented validation path.

Review requests must report actual results rather than assumed results.

---

## 20. Diff Review Before Commit

Before committing, inspect what will enter the commit.

Useful checks include:

```text
git status
git diff --check
git diff --stat
git diff
```

After staging, inspect the staged contribution:

```text
git diff --cached --name-only
git diff --cached --check
git diff --cached --stat
git diff --cached
```

The goal is to verify that:

- only intended files are present,
- whitespace errors are not introduced,
- unrelated changes are excluded,
- no accidental secrets or generated runtime artifacts are included.

---

## 21. Staging Discipline

Prefer staging the intended files or task scope explicitly when practical.

Be cautious with broad staging operations when unrelated local work may exist.

A contributor is responsible for understanding what is staged before committing.

Generated files should be committed only when repository policy explicitly requires them to be versioned.

---

## 22. Commit Message Convention

The project uses Conventional Commits format:

```text
<type>[optional scope]: <description>
```

Optional bodies and footers may be used when useful.

Examples:

```text
feat(policy-engine): add rule evaluator
fix(browser-runtime): release expired control lease
test(agent-contracts): cover invalid delivery status
docs: establish contribution workflow
chore: bootstrap monorepo
```

Common project commit types are:

```text
feat
fix
docs
test
refactor
perf
build
ci
chore
style
```

A breaking change must be clearly identified using the Conventional Commits breaking-change form when applicable.

The repository will later enforce commit-message policy automatically.

---

## 23. Commit Scope

A commit should represent one coherent change.

Avoid combining independent behavior changes, formatting sweeps, dependency upgrades, and unrelated documentation edits into a single commit.

A reviewable commit should make it possible to understand:

- what changed,
- why it changed,
- what requirement it addresses,
- how it was validated.

Do not create meaningless intermediate commits solely to satisfy the existence of a commit when the branch will be submitted as completed work.

---

## 24. Commit Ownership and Evidence

A commit hash is evidence of repository state, not proof that review or tests succeeded.

Developer deliveries must eventually associate the submitted commit with validation evidence through the structured delivery contract.

Do not claim that a commit was reviewed merely because it exists on an expected branch.

---

## 25. Developer Submission

A Developer submits completed work to the Team Leader only after required self-validation.

The Developer delivery must eventually include structured data capable of representing:

```text
task_id
status
branch
files_created
files_modified
tests_created
validations_executed
validation_results
requirements_covered
known_limitations
commit_id
```

The exact contract will be implemented in the agent-contracts package.

A free-form message such as `done` is not sufficient for a workflow-critical submission.

---

## 26. Team Leader Review

The Team Leader reviews Developer work before it can enter the Team Leader's feature branch.

The review must consider the task specification and applicable governance, including as relevant:

- branch correctness,
- task scope,
- changed files,
- implementation completeness,
- test quality,
- validation evidence,
- architecture compliance,
- security impact,
- protected-file compliance,
- known limitations,
- unrelated changes.

If a required check fails or a blocking finding exists, the work must not be approved.

---

## 27. Review Findings

Review rejection must be actionable.

A finding should eventually be represented by structured fields such as:

```text
finding_id
severity
file_or_component
issue
expected_change
required_validation
```

When practical, the reviewer should identify the observable problem and expected outcome rather than prescribe an unnecessarily rigid implementation technique.

---

## 28. Correction Workflow

A rejected Developer submission returns to correction:

```text
Developer submission
  -> Team Leader review
  -> changes requested
  -> Developer correction
  -> Developer self-validation
  -> Team Leader review
```

Unresolved findings remain active until corrected or formally withdrawn.

The normal correction cycle is bounded by agent governance. Reaching the configured limit causes escalation rather than an infinite retry loop.

---

## 29. Team Leader Integration

After Developer work is approved, it may be integrated into the authorized Team Leader feature branch through the governed mechanism.

The Team Leader must not integrate unreviewed work simply because the branch is conflict-free.

After integration, relevant feature-level validation must run before submission to the Architect.

When the Git Controller is available, this operation should be requested through it rather than performed through unrestricted Git commands.

---

## 30. Architect Review

A Team Leader submits the integrated feature to the Architect after Leader-level validation succeeds.

The Architect evaluates system-level concerns, including:

- architecture conformance,
- component boundaries,
- dependency direction,
- public contracts,
- accepted ADRs,
- security boundaries,
- integration evidence,
- maintainability,
- consistency with the Project Charter.

The Architect may approve integration into `test` or return the feature for correction.

---

## 31. Integration into `test`

Integration into `test` requires the approval path defined by agent governance.

A Developer must not merge directly into `test`.

A Team Leader must not bypass Architect review and merge directly into `test`.

An approved feature entering `test` must remain subject to integration validation.

Passing feature-level tests does not eliminate the requirement for integration-level validation when such validation applies.

---

## 32. Production Promotion

`main` is the production branch.

Promotion from the governed integration state to `main` requires explicit human approval.

Silence, timeout, model confidence, a passing test suite, or Architect approval alone is not production approval.

Production promotion should become a dedicated governed operation rather than a free-form Git command.

---

## 33. Pull Requests and Remote Protection

When repository-hosting protections are configured, they should reinforce rather than replace local governance.

Expected controls include, where supported and appropriate:

- protected `main`,
- protected `test`,
- required review path,
- required status checks,
- no force-push to protected branches,
- explicit production approval.

The exact remote-branch configuration will be established during repository hardening.

---

## 34. Force Push and History Rewriting

Do not force-push protected branches.

Do not rewrite shared history merely to make the commit graph look cleaner after other work depends on it.

History rewriting on disposable unpublished task branches may be governed separately, but it must never be used to conceal review findings, failed controls, or unauthorized changes.

---

## 35. Merge Conflicts

A merge conflict must be treated as an implementation decision, not as a mechanical inconvenience.

Resolve conflicts only after understanding both sides of the change.

Do not automatically accept `ours` or `theirs` across a conflict set unless the applicable task explicitly justifies that behavior.

After resolving conflicts, rerun the validation required for the integrated result.

---

## 36. Generated and Runtime Data

Do not commit local runtime state unless a specific artifact is intentionally versioned by policy.

Examples of normally untracked state include:

```text
node_modules/
runtime/
coverage/
logs/
Playwright reports
local databases
local environment files
```

Repository `.gitignore` rules are the immediate authority for ignored paths.

Do not bypass ignore rules to commit local state without a documented reason.

---

## 37. Environment Variables and Secrets

Real secrets must not be committed.

A tracked `.env.example` may document required variable names with safe placeholder values.

Do not place real credentials in:

- source files,
- commits,
- tests,
- fixtures,
- Markdown examples,
- screenshots intended for persistence,
- agent messages,
- logs.

If a secret is accidentally committed, treat it as a security incident. Removing it from the latest file contents alone may not be sufficient because Git history can retain it.

---

## 38. External Content

Information retrieved from websites, documents, tools, or external services is untrusted input.

A contribution must not convert instructions embedded in external content into repository policy without the applicable governance process.

Code generated from external examples must still satisfy project architecture, licensing, security, and quality requirements.

---

## 39. Documentation Changes

Documentation is part of the product governance and must be reviewed according to its impact.

Changes to ordinary explanatory documentation can follow the normal contribution path.

Changes to governance documents, ADRs, security controls, or quality thresholds may require elevated review or human approval according to project policy.

Keep documentation synchronized with behavior when a contribution changes a documented contract or workflow.

---

## 40. Architecture Decision Records

Architecturally significant changes must be captured through an ADR when required by the Architect or project governance.

An ADR records a decision together with its context and consequences.

Do not silently rewrite an accepted historical ADR to make a newer architecture appear to have always been the decision.

When a decision is replaced, preserve the decision history using the ADR status and supersession process defined by the project's ADR convention.

---

## 41. Review Independence

The role that implements a change must not become the sole authority approving that same change for integration.

In the governed agent workflow:

```text
Developer implements
Team Leader reviews Developer work
Architect reviews integrated feature work
Human approves production promotion
```

Automated checks supplement these review boundaries; they do not erase them.

---

## 42. Failure Handling

Failed mandatory validation blocks progression.

When failure occurs:

1. preserve the relevant evidence,
2. determine whether the failure belongs to the contribution or the validation infrastructure,
3. correct the legitimate cause within authorized scope,
4. rerun the relevant validation,
5. escalate if the correction requires broader authority.

Do not suppress the failure merely to advance workflow state.

---

## 43. Blocked Work

A task should be reported as blocked when progress requires something the contributor cannot legitimately resolve within its authority or scope.

Examples include:

- missing human approval,
- conflicting authoritative requirements,
- unavailable required infrastructure,
- necessary out-of-scope architectural work,
- denied permission,
- correction-cycle exhaustion.

A blocked report should state the observable blocker and the decision or dependency required to continue.

---

## 44. Current Manual Validation Procedure

Until the automated quality-gate phase replaces these manual steps, documentation-only contributions should use the following baseline:

```text
git status
git diff --check
git add <intended-files>
git diff --cached --name-only
git diff --cached --check
git diff --cached --stat
pnpm typecheck
```

Review the output before committing.

For source-code changes, execute all additional task-specific validation required by the implementation.

This section is transitional. Automated hooks and repository scripts will become the preferred interface once implemented.

---

## 45. Commit Procedure During Bootstrap

While quality automation is still being established, use the following sequence after successful validation:

```text
git commit -m "<conventional-commit-message>"
git push origin <current-governed-branch>
git status
```

The final status must be understood. Do not assume a push succeeded without checking the command result.

Once commit hooks and push gates are implemented, their successful execution becomes part of this process.

---

## 46. Definition of Ready for Review

A contribution is ready for review when:

- the requested scope is complete,
- required tests have been created or updated,
- required local validation passes,
- the contributor inspected the diff,
- unrelated changes are absent,
- known limitations are disclosed,
- the branch is correct,
- a reviewable commit exists when required by the workflow,
- the structured delivery contract is complete when that system is available.

If any mandatory condition is missing, report the actual state instead of claiming readiness.

---

## 47. Definition of Done for a Developer Task

A Developer task is done only after:

1. implementation is complete within scope,
2. required tests exist,
3. Developer self-validation succeeds,
4. delivery evidence is submitted,
5. Team Leader review approves the work,
6. the approved work is safely integrated into the Team Leader branch through the governed process.

Developer self-declaration alone does not satisfy this definition.

---

## 48. Definition of Done for a Feature

A feature is done at the integration level only after:

1. its Developer tasks satisfy their completion requirements,
2. Team Leader integration is complete,
3. feature-level validation succeeds,
4. Architect review approves the feature,
5. governed integration into `test` succeeds,
6. required integration validation on `test` succeeds.

Production release is a separate state requiring explicit human approval.

---

## 49. Human Contributions

Human contributors are expected to respect the same repository quality and security controls that apply to agent-generated changes.

Human authority may exceed agent authority where explicitly defined by project governance, but human edits should not silently circumvent the documented review and validation process when those controls are intended to protect repository integrity.

Emergency exceptions should be explicit, reviewable, and documented according to the applicable policy.

---

## 50. Automation Evolution

Many procedures in this document are initially manual.

The project intentionally starts with visible manual validation so the team understands each invariant before automating it.

Later phases will convert repetitive rules into:

```text
package scripts
Husky hooks
lint-staged
ESLint
Prettier
Vitest
architecture checks
secret scanning
OpenCode permissions/plugins
Policy Engine rules
Git Controller operations
CI checks
remote branch protection
```

Once a deterministic implementation becomes authoritative, contributors should use the standardized automated interface rather than duplicating the rule manually.

---

## 51. Contribution Checklist

Before submitting implementation work, confirm the applicable items:

```text
[ ] I am on the correct governed branch.
[ ] The change is within the assigned scope.
[ ] I inspected relevant architecture and governance.
[ ] I did not include unrelated changes.
[ ] Required tests were created or updated.
[ ] Required validation passed.
[ ] I inspected the diff.
[ ] I did not weaken protected controls to make the change pass.
[ ] I did not include secrets or local runtime state.
[ ] Known limitations and blockers are disclosed.
[ ] The commit message follows project convention.
[ ] Required structured delivery evidence is complete.
```

Not every item applies to documentation-only work, but no applicable mandatory item may be silently ignored.

# ADR-0004: Git Branching and Promotion

- **Status:** Accepted
- **Date:** 2026-10-21
- **Decision owners:** Human project owner during bootstrap governance
- **Related governance:** `docs/architecture/PROJECT_CHARTER.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ADR-0003`
- **Supersedes:** Previous provisional `lider_<feature>` / `dev_<feature>_<task>` naming documented before this ADR
- **Superseded by:** None

## Context and Problem Statement

The development hierarchy defined by ADR-0003 requires Git branches to make feature ownership, Developer task ownership, review boundaries, integration stages, and production promotion explicit.

The original provisional convention used `lider_<feature>` for Team Leader branches and `dev_<feature>_<task>` for Developer branches. During governance design, a more structured feature namespace was selected so related branches are visibly grouped and can be parsed deterministically by future branch guards and the Git Controller.

The project also requires useful commit history for human and agent review. A Conventional Commit subject identifies the type and scope of a change, but substantive commits may contain several meaningful outcomes. Those outcomes should be summarized without forcing reviewers to infer intent from file lists.

This decision is architecturally significant because branch names and promotion paths encode development authority and will be consumed by hooks, policy rules, structured deliveries, Git Controller operations, audit events, CI, and remote branch protection.

## Decision Drivers

- Make feature ownership visible directly in branch names.
- Make the relationship between a Team Leader integration branch and Developer task branches deterministic.
- Keep `main` and `test` semantically stable.
- Prevent Developer work from bypassing Team Leader review.
- Prevent Team Leader work from bypassing Architect review.
- Require explicit human authority for production promotion.
- Make branch naming simple to validate mechanically.
- Keep commit history concise at the subject level while preserving meaningful implementation summaries.
- Avoid commit bodies that merely duplicate file lists already observable from Git.
- Move sensitive Git mutations behind a deterministic Git Controller as the harness matures.

## Considered Options

### Option A: Prefixed flat branch names

Use the provisional convention:

```text
lider_<feature>
dev_<feature>_<task>
```

### Option B: Feature namespace with reserved `common` branch

Use:

```text
<feature>/common
<feature>/<task>
```

where `common` is reserved for the Team Leader integration branch.

### Option C: Generic Git Flow branch categories

Use categories such as `feature/`, `develop`, and `release/` without directly encoding the project's Architect/Leader/Developer authority model.

### Option D: Short-lived Developer branches directly targeting `test`

Allow Developer task branches to target the integration branch directly and rely on review configuration rather than a feature-level Leader integration branch.

## Decision Outcome

> We will use feature-scoped branch namespaces with `<feature>/common` as the Team Leader integration branch and `<feature>/<task>` as Developer task branches. `test` remains the Architect-governed integration/pre-production branch, and `main` remains the production branch.

The branch hierarchy is:

```text
main
  ^
test
  ^
<feature>/common
  ^
<feature>/<task>
```

For a feature named `form-interaction`, examples are:

```text
form-interaction/common
form-interaction/text-input
form-interaction/dropdown-selector
form-interaction/date-picker
```

### Branch semantics

`main`:

- represents production,
- receives promotion only after the required explicit human approval.

`test`:

- represents governed integration and pre-production validation,
- is governed by the Architect workflow,
- receives feature integration only after Team Leader validation and Architect approval.

`<feature>/common`:

- is the integration branch for one feature,
- is owned operationally by the Team Leader assigned to that feature,
- receives only reviewed Developer work through the governed integration process,
- is the branch submitted to the Architect for feature-level review.

`<feature>/<task>`:

- is a Developer task branch,
- represents a bounded implementation activity within `<feature>`,
- is created from the authorized `<feature>/common` baseline,
- may integrate only toward the matching `<feature>/common` through the governed review process.

### Naming rules

Feature and task tokens use:

```text
lowercase ASCII
kebab-case
no spaces
```

Names must be descriptive enough to identify the bounded responsibility.

The following patterns are reserved or prohibited:

```text
<feature>                 prohibited as a standalone branch when that feature namespace is used
<feature>/common          reserved for the Team Leader
<feature>/common/<name>   prohibited
<feature>/<task>/common   prohibited
```

A Developer must not use `common` as a task token.

The exact validation regular expression will be defined by the quality-gate implementation.

### Branch creation

A Team Leader integration branch is created from the authorized current `test` baseline:

```text
test
  -> <feature>/common
```

A Developer task branch is created from the matching Team Leader branch:

```text
<feature>/common
  -> <feature>/<task>
```

The Git Controller must eventually verify these ancestry and naming rules before protected operations.

### Integration path

The normal integration path is:

```text
<feature>/<task>
        |
        | Developer self-validation
        v
Team Leader review
        |
        v
<feature>/common
        |
        | feature validation
        v
Architect review
        |
        v
test
        |
        | integration validation
        v
explicit human production approval
        |
        v
main
```

A merge conflict, successful test suite, or technically valid Git command does not bypass the required authority chain.

### Production authority

Production promotion requires explicit human approval.

Architect approval is necessary for the governed integration path but is not sufficient for promotion to `main`.

Silence, timeout, model assertion, or passing automation must not be interpreted as production approval.

### Commit message structure

The project continues using Conventional Commits for the subject:

```text
<type>[optional scope]: <summary>
```

For substantive commits containing multiple meaningful outcomes, the commit body must include a concise unordered bullet summary.

Preferred form:

```text
feat(form-interaction): add dropdown selector components

- add DOM element selection basis
- add selector options reader
- add option selection behavior
- cover selection behavior with tests
```

The bullet list should describe meaningful outcomes or behavior, not merely repeat changed filenames.

Simple commits whose subject fully communicates the change do not require an artificial body. For example:

```text
docs: correct ADR index typo
```

The commit body remains compatible with optional Conventional Commit bodies and may be followed by applicable footers.

### Commit body quality

For a substantive multi-change commit:

- use `-` unordered bullets,
- keep each bullet concise,
- describe an observable implementation outcome, contract, validation, or behavior,
- avoid redundant file inventories,
- disclose important tests added when they are a meaningful part of the change,
- do not claim work that is absent from the staged diff.

The structured Developer delivery remains the authoritative workflow evidence. Commit text improves repository history but does not replace test results, review records, or delivery contracts.

### Git Controller direction

Critical Git mutations must progressively move behind deterministic controller operations, conceptually including:

```text
createFeatureBranch(feature)
createDeveloperBranch(feature, task)
submitDeveloperWork(task)
integrateDeveloperWork(feature, task)
submitFeature(feature)
integrateFeatureToTest(feature)
requestProductionPromotion()
```

These names are conceptual and do not define the final API.

The controller must validate identity, role, branch, workflow state, required validation, reviews, and approvals before performing protected mutations.

## Consequences

### Positive

- Related Leader and Developer branches are visibly grouped under a feature namespace.
- The branch structure directly represents the feature/task relationship used by the agent hierarchy.
- Future branch guards can parse feature ownership without encoding role prefixes in every branch name.
- `common` provides a predictable feature integration target for Developers and the Team Leader.
- Developer branches remain descriptive and bounded to specific work.
- The promotion path mirrors the Architect/Leader/Developer separation of duties.
- Commit bodies provide useful summaries for code review without sacrificing Conventional Commit subjects.
- Outcome-oriented bullets improve `git log` usefulness for humans and agents.
- A future Git Controller can expose narrow operations rather than unrestricted mutation commands.

### Negative / Trade-offs

- `common` becomes a reserved semantic token that contributors must understand.
- Feature namespaces require validation to prevent malformed or ambiguous branch names.
- Existing governance documents using the provisional `lider_` and `dev_` names must be updated after this ADR is accepted.
- Multi-line commit policy adds authoring effort for substantive commits.
- Determining whether a commit is sufficiently substantive to require bullets is partly semantic and should initially remain a review rule rather than an overcomplicated hook heuristic.
- Long-lived feature branches can accumulate divergence from `test`; feature scope and lifetime must therefore remain bounded.

### Neutral / Follow-up

- Update `docs/architecture/PROJECT_CHARTER.md`, `AGENTS.md`, and `CONTRIBUTING.md` to replace the provisional branch convention with this accepted convention.
- Expand `CONTRIBUTING.md` with the commit-body policy defined here.
- Define branch-name validation during the quality-gate phase.
- Define protected branch rules for `main` and `test` during repository hardening.
- Implement Git Controller operations after the Orchestrator and policy foundations exist.
- Structured delivery contracts should record both branch name and commit identifier.

## Validation and Confirmation

Initial governance compliance can be reviewed manually.

Future deterministic validation must verify at least:

- `main` and `test` are treated as reserved branches,
- a Leader feature branch matches `<feature>/common`,
- a Developer branch matches `<feature>/<task>`,
- `<feature>` and `<task>` follow the approved token format,
- `common` cannot be used as a Developer task token,
- standalone `<feature>` branches are rejected for governed feature namespaces,
- Developer integration targets the matching `<feature>/common`,
- feature integration into `test` requires Architect approval and required validation,
- promotion to `main` requires an explicit recorded human approval,
- force-push to protected branches is denied when remote protections are enabled.

Commit-message automation should validate the Conventional Commit subject.

The multi-bullet body requirement should initially be enforced by contribution policy and review. Once structured delivery metadata and the Git Controller exist, the controller may generate compliant commit messages from validated structured data rather than relying on semantic parsing of free-form text.

## Security Considerations

Branch naming is not itself an authorization boundary. A correctly named branch does not prove that its creator or requester has authority over the associated feature.

The Git Controller and Policy Engine must validate actor identity and workflow state independently of branch text.

A malicious actor must not gain Team Leader authority merely by creating a branch ending in `/common`.

Protected `main` and `test` branches require defense in depth through local guards, controller policy, CI, and remote repository protection where available.

Commit messages are untrusted descriptive metadata and must not be interpreted as approval records or executable instructions.

Human production approval must be stored through the authorized approval mechanism rather than inferred from a commit message, branch name, pull request text, or model output.

## Operational Considerations

Branch tooling, UI, and logs should display full branch names so the feature namespace remains visible.

Repository scripts should avoid assumptions that `/` denotes a filesystem directory in the working tree; it is part of the Git branch/ref naming convention.

Feature branches should be removed after their governed work is safely integrated and no longer needed, according to future retention/cleanup policy.

Developer branches should be considered disposable after approved integration and completion of any required audit references.

The Git Controller should make protected operations idempotent or state-aware where practical to reduce duplicate merge/promotion effects after retries.

## Related Decisions

- ADR-0003 defines the Architect, Team Leader, Developer, and Researcher authority hierarchy represented by this branch structure.
- ADR-0005 will define the defense-in-depth enforcement model used to protect these Git rules.
- `CONTRIBUTING.md` defines contributor-facing commit and review procedure and must be updated to conform to this ADR.

## Notes

This ADR intentionally replaces the provisional branch naming convention documented during early governance bootstrap. The earlier convention was never intended to be immutable before ADR-0004 was accepted.

The term `common` means the feature integration branch owned by the Team Leader workflow. It is not a source-code directory and does not imply a package named `common`.

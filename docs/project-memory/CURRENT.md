# Current Project State

This document is the Architect-maintained operational entry point for resuming the Multi-Agent Automation Platform.

It is a concise summary, not an authority source.

If this document conflicts with current Git evidence, the Project Charter, Accepted ADRs, protected governance, security policy, or an explicit governed Human decision, report the conflict and follow the higher-authority source.

## Current phase

Phase 4: OpenCode agent configuration.

## Completed Phase 4 work

### OpenCode current-state audit

Completed.

Verified:

- OpenCode CLI 2.1.4 is operational.
- OpenCode discovers the configured Ollama provider.
- `ollama/qwen3:8b` completed an inference smoke test.

### Governance maintenance workflow

Completed.

ADR-0007 established the `governance/<task>` workflow for Human-authorized protected-governance maintenance.

The workflow separates:

1. Human authorization to implement a proposal;
2. Human authorization to accept the resulting implementation.

### OpenCode governed agent baseline

Completed.

The governed project roles are:

```text
  Human
    |
Architect
    |
Team Leader
    |
Developer
```

Researcher is an auxiliary read-oriented role.

The OpenCode project baseline defines:

- Architect;
- Team Leader;
- Developer;
- Researcher.

Selectable built-in agents that could bypass the governed role hierarchy are disabled by project configuration.

OpenCode project configuration is protected governance.

## Current governance work

GOV-02.1: Repository-Resident Operational Memory.

Status:

Human implementation approval received;
implementation in progress.

The approved baseline includes:

- /good-morning;
- /checkpoint;
- /close-session;
- /dev-written-handoff;
- /leader-written-handoff;
- /researcher-written-handoff;
- repository-resident operational memory;
- per-session and per-actor memory namespaces;
- append-only checkpoints;
- Architect-owned session closeout and learning classification.

The implementation must not enable external OneDrive access.

## Important Phase 4 boundary

Phase 4 configures declared responsibilities and capabilities.

It does not claim deterministic authorization.

Deferred to Phase 5:

- deterministic actor identity;
- task-scoped Developer filesystem authorization;
- per-actor operational-memory namespace enforcement;
- contextual Architect governance editing based on branch, approved scope, and Human authorization;
- machine-verifiable Human approval state.

## Current memory Authority

Operational project memory lives under:

```text
docs/project-memory/
```

Git remains authoritative for versioned project state.

Operational memory does not override Charter, Accepted ADRs, protected governance, security policy, or current observable repository evidence.

### Pending Human decisions

None recorded at initialization of this memory baseline.

### Known deferred work

- Deterministic role enforcement in Phase 5.
- Structured machine-validatable agent contracts in Phase 6.
- Model/provider evaluation later in Phase 4.
- Evaluation of NVIDIA-hosted model endpoints.
- Automatic external-memory integrations are intentionally deferred.

## Current next step

Complete GOV-02.1 by implementing and validating the six operational-memory commands and skills.

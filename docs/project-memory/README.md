# Project Operational Memory

This directory contains the durable operational memory of the Multi-Agent
Automation Platform.

Its purpose is to preserve enough evidence and context for work to be resumed
after interruption, session replacement, model changes, context compaction, or
long periods between development sessions.

Operational memory is evidence and context. It is not project authority.

## Authority order

When sources disagree, use the following authority order:

1. explicit Human decisions within their governed authority;
2. the Project Charter;
3. Accepted Architecture Decision Records;
4. version-controlled governance and security policy;
5. observable repository and tool evidence;
6. operational project memory;
7. transient model or conversation context.

Operational memory must never silently override a higher-authority source.

For observable repository state, current machine-verifiable evidence wins over
a stale memory record.

For example, if a checkpoint says that a task is complete but Git shows
uncommitted work, the repository state must be reported as inconsistent with
the checkpoint rather than silently accepting the checkpoint.

## Memory model

Operational memory is organized by working session.

Each session has an isolated directory:

A session may contain:

```text
architect/
  checkpoints/

leaders/
  <leader-id>/
    checkpoints/
    handoffs/

developers/
  <developer-id>/
    checkpoints/
    handoffs/

researchers/
  <researcher-id>/
    checkpoints/
    handoffs/

learning-candidates.md
close-session.md
```

Actor identities are operational labels during Phase 4.

Deterministic actor identity and namespace authorization belong to the deterministic role-enforcement milestone.

## Single-writer responsibilities

Each actor writes only its own operational artifacts during normal work.

The Architect is the only role responsible for writing shared session artifacts such as:

- close-session.md;
- the consolidated learning classification;
- CURRENT.md.

Team Leaders, Developers, and Researchers must not independently rewrite the global current-state summary.

Deterministic enforcement of actor-specific write namespaces is deferred to the role-enforcement milestone.

## Checkpoints

A checkpoint preserves an actor's state at one moment during a session.

Checkpoints are append-only.

After a checkpoint has been published, later discoveries do not rewrite it. A later checkpoint records the correction or changed understanding.

Use sequential filenames within an actor namespace, for example:

```text
001-initial-state.md
002-plan-ready.md
003-review-complete.md
```

A checkpoint records at minimum:

- session identifier;
- actor role;
- actor identifier;
- timestamp;
- branch, when applicable;
- Git HEAD, when applicable;
- current assignment;
- completed work;
- verified claims and their evidence;
- explicitly unverified claims;
- current working-tree state;
- failed attempts that materially affect continuation;
- decisions observed;
- Human decisions observed;
- blockers;
- pending work;
- next exact step;
- learning candidates.

A checkpoint must never represent an unexecuted validation as successful.

## Written handoffs

A written handoff transfers completed or blocked work between roles.

A handoff is distinct from a checkpoint.

A checkpoint answers:

    Where am I and what is currently known?

A handoff answers:

    What am I delivering to the next authority,and what evidence supports it?

The initial handoff flows are:

```text
Developer -> Team Leader
Team Leader -> Architect
Researcher -> requesting Architect or Team Leader
```

No handoff constitutes Human approval.

No receiving agent may treat another agent's statement that Human approval exists as equivalent to machine-verifiable or directly observed Human authorization.

## Session close

There is exactly one global closeout for a coordinated working session.

The Architect owns /close-session.

Before producing the closeout, the Architect coordinates evidence collection from active subordinates.

Conceptually:

```text
Architect
  |
  +-- Researchers
  |     -> checkpoint
  |     -> researcher handoff
  |
  +-- Team Leaders
        |
        +-- Developers
        |     -> checkpoint
        |     -> Developer handoff
        |
        -> Leader checkpoint
        -> Leader handoff
```

The Architect then evaluates:

- every relevant checkpoint from the session;
- every relevant written handoff;
- current Git evidence;
- validation evidence;
- pull-request and integration state when applicable;
- Human decisions observed during the session.

The final closeout must identify contradictions rather than silently reconcile incompatible evidence.

## Session opening

/good-morning reconstructs the current project state.

Normally it should prefer concise durable summaries:

- CURRENT.md;
- the latest session closeout;
- pending Human decisions;
- relevant Accepted ADRs and governance;
- current repository evidence.

It should not load every historical checkpoint by default.

Historical checkpoints are opened when:

- the closeout references them;
- evidence conflicts;
- details are required to answer a question;
- the Human explicitly requests historical context.

/good-morning reconstructs work. It does not begin implementation automatically.

It finishes by reporting the reconstructed state and waiting for Human direction.

## Learning classification

Agents may identify learning candidates.

Candidates are not automatically promoted into permanent project behavior.

During session close, candidates are classified as one of:

### INCIDENTAL

Session-specific information that remains only in checkpoints or the closeout.

### ENVIRONMENT_REFERENCE

A durable fact about the development environment or an external dependency that is likely to matter again.

### BACKLOG

Work that should be considered in a future task.

### SKILL_CANDIDATE

A repeatable workflow or technique that may deserve a reusable skill.

Classification does not create or modify a skill automatically.

### ADR_CANDIDATE

A potentially architecturally significant decision.

The Architect evaluates whether the normal ADR lifecycle applies.

Classification does not create or accept an ADR automatically.

### GOVERNANCE_CANDIDATE

A proposed change to protected governance or authority.

A governance candidate must follow ADR-0007 and GOV-01.

It must not automatically create a governance branch, edit governance, or claim approval.

### SECURITY_FINDING

A potentially security-relevant discovery.

Security findings must be surfaced explicitly and handled according to the applicable security and governance process rather than silently remaining an ordinary backlog item.

### HUMAN_DECISION_PENDING

A question that requires Human authority.

It remains visible in the current project state until resolved or explicitly withdrawn.

## Learning authority

A single incident does not become permanent agent governance merely because it occurred.

The normal learning path is:

```text
observation
-> checkpoint
-> classification
-> candidate
-> review by appropriate authority
-> permanent artifact when justified
```

Permanent artifacts may include:

- project documentation;
- reusable skills;
- Architecture Decision Records;
- governance changes;
- backlog work.

Each continues through its own required approval process.

## Sensitive information

Operational memory must not contain:

- secrets;
- authentication credentials;
- API keys;
- private keys;
- personal data not explicitly governed for storage;
- raw secret-bearing environment files;
- transient external-system state represented as durable truth.

Sensitive evidence must be redacted or referenced without copying sensitive content into project memory.

Secret scanning remains an additional defense, not permission to record sensitive information.

## Relationship to OneDrive

The Git repository is the authoritative store for operational project memory.

A clone or synchronized copy in OneDrive may provide additional availability or backup, but it must not become a separate authoritative memory system.

Information required to resume the governed project must not exist only in an external personal copy.

OpenCode agents do not require access to OneDrive for this memory model.

The project-level external_directory restriction therefore remains in place.

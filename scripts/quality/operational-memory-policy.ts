export const SESSION_STATES = {
  open: 'OPEN',
  closePrepared: 'CLOSE_PREPARED',
  closed: 'CLOSED',
} as const;

export type SessionState = (typeof SESSION_STATES)[keyof typeof SESSION_STATES];

export const HUMAN_CLOSE_DECISIONS = {
  confirmClose: 'CONFIRM_CLOSE',
  closeWithPendingItems: 'CLOSE_WITH_PENDING_ITEMS',
  cancelClose: 'CANCEL_CLOSE',
} as const;

export type HumanCloseDecision = (typeof HUMAN_CLOSE_DECISIONS)[keyof typeof HUMAN_CLOSE_DECISIONS];

export const CANDIDATE_DISPOSITIONS = {
  acceptForProposal: 'ACCEPT_FOR_PROPOSAL',
  acceptAsBacklog: 'ACCEPT_AS_BACKLOG',
  acceptAsReference: 'ACCEPT_AS_REFERENCE',
  defer: 'DEFER',
  reject: 'REJECT',
  needsMoreEvidence: 'NEEDS_MORE_EVIDENCE',
} as const;

export type CandidateDisposition =
  (typeof CANDIDATE_DISPOSITIONS)[keyof typeof CANDIDATE_DISPOSITIONS];

export const INTEGRATION_DISPOSITIONS = {
  noChanges: 'NO_CHANGES',
  uncommittedWork: 'UNCOMMITTED_WORK',
  committedNotPushed: 'COMMITTED_NOT_PUSHED',
  pullRequestOpen: 'PR_OPEN',
  merged: 'MERGED',
  deferred: 'DEFERRED',
  discardApproved: 'DISCARD_APPROVED',
} as const;

export type IntegrationDisposition =
  (typeof INTEGRATION_DISPOSITIONS)[keyof typeof INTEGRATION_DISPOSITIONS];

export interface OperationalMemorySession {
  schemaVersion: 1;
  id: string;
  state: SessionState;
  createdAt: string;
  baseHead: string;
  closePreparation?: string;
  closedAt?: string;
  closeout?: string;
}

export interface SessionArtifactState {
  closePreparationExists: boolean;
  closeoutExists: boolean;
}

export interface FinalizeSessionRequest {
  session: OperationalMemorySession;
  artifacts: SessionArtifactState;
  humanDecision?: HumanCloseDecision;
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
}

export type HeadClaimKind = 'historical' | 'current';

export interface HeadClaimAssessment {
  conflict: boolean;
  recordedHead: string;
  observedHead: string;
  reason: string;
}

const SESSION_ID_PATTERN = /^session-(\d{8})-(\d{3})$/;
const DATE_TOKEN_PATTERN = /^\d{8}$/;
const GIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

export function parseSessionId(
  sessionId: string,
): { dateToken: string; sequence: number } | undefined {
  const match = SESSION_ID_PATTERN.exec(sessionId);

  if (match === null) {
    return undefined;
  }

  const dateToken = match[1];
  const sequenceToken = match[2];

  if (dateToken === undefined || sequenceToken === undefined) {
    return undefined;
  }

  return {
    dateToken,
    sequence: Number.parseInt(sequenceToken, 10),
  };
}

export function allocateSessionId(
  dateToken: string,
  existingSessionIds: readonly string[],
): string {
  if (!DATE_TOKEN_PATTERN.test(dateToken)) {
    throw new Error('session date token must use YYYYMMDD numeric format');
  }

  const sequences = existingSessionIds
    .map(parseSessionId)
    .filter(
      (
        parsed,
      ): parsed is {
        dateToken: string;
        sequence: number;
      } => parsed !== undefined && parsed.dateToken === dateToken,
    )
    .map((parsed) => parsed.sequence);

  const nextSequence = sequences.length === 0 ? 1 : Math.max(...sequences) + 1;

  if (nextSequence > 999) {
    throw new Error(`session sequence exhausted for date: ${dateToken}`);
  }

  return `session-${dateToken}-${String(nextSequence).padStart(3, '0')}`;
}

export function validateSessionManifest(session: OperationalMemorySession): string[] {
  const violations: string[] = [];

  if (session.schemaVersion !== 1) {
    violations.push('session schemaVersion must be 1');
  }

  if (parseSessionId(session.id) === undefined) {
    violations.push('session id must use session-YYYYMMDD-NNN format');
  }

  if (Number.isNaN(Date.parse(session.createdAt))) {
    violations.push('session createdAt must be a valid timestamp');
  }

  if (!GIT_SHA_PATTERN.test(session.baseHead)) {
    violations.push('session baseHead must be a Git SHA');
  }

  if (session.state === SESSION_STATES.open) {
    if (session.closePreparation !== undefined) {
      violations.push('OPEN session must not reference close preparation');
    }

    if (session.closedAt !== undefined || session.closeout !== undefined) {
      violations.push('OPEN session must not contain closed-session metadata');
    }
  }

  if (session.state === SESSION_STATES.closePrepared) {
    if (session.closePreparation === undefined) {
      violations.push('CLOSE_PREPARED session must reference close preparation');
    }

    if (session.closedAt !== undefined || session.closeout !== undefined) {
      violations.push('CLOSE_PREPARED session must not contain final closeout metadata');
    }
  }

  if (session.state === SESSION_STATES.closed) {
    if (session.closePreparation === undefined) {
      violations.push('CLOSED session must reference close preparation');
    }

    if (session.closedAt === undefined) {
      violations.push('CLOSED session must contain closedAt');
    } else if (Number.isNaN(Date.parse(session.closedAt))) {
      violations.push('CLOSED session closedAt must be a valid timestamp');
    }

    if (session.closeout === undefined) {
      violations.push('CLOSED session must reference closeout');
    }
  }

  return violations.sort((left, right) => left.localeCompare(right));
}

export function canWriteSessionArtifact(
  session: OperationalMemorySession,
  artifact: 'checkpoint' | 'handoff',
): PolicyDecision {
  if (session.state === SESSION_STATES.open) {
    return {
      allowed: true,
    };
  }

  return {
    allowed: false,
    reason: `${artifact} writes require an OPEN session`,
  };
}

export function canPrepareSessionClose(
  session: OperationalMemorySession,
  artifacts: SessionArtifactState,
): PolicyDecision {
  if (session.state !== SESSION_STATES.open) {
    return {
      allowed: false,
      reason: 'session close preparation requires an OPEN session',
    };
  }

  if (artifacts.closeoutExists) {
    return {
      allowed: false,
      reason: 'closed-session closeout already exists',
    };
  }

  return {
    allowed: true,
  };
}

export function canFinalizeSessionClose(request: FinalizeSessionRequest): PolicyDecision {
  const { session, artifacts, humanDecision } = request;

  if (session.state !== SESSION_STATES.closePrepared) {
    return {
      allowed: false,
      reason: 'session finalization requires CLOSE_PREPARED state',
    };
  }

  if (session.closePreparation === undefined || !artifacts.closePreparationExists) {
    return {
      allowed: false,
      reason: 'session finalization requires close preparation evidence',
    };
  }

  if (artifacts.closeoutExists) {
    return {
      allowed: false,
      reason: 'session closeout already exists and is immutable',
    };
  }

  if (humanDecision === undefined) {
    return {
      allowed: false,
      reason: 'session finalization requires an explicit Human close decision',
    };
  }

  if (humanDecision === HUMAN_CLOSE_DECISIONS.cancelClose) {
    return {
      allowed: false,
      reason: 'Human canceled the prepared session close',
    };
  }

  return {
    allowed: true,
  };
}

export function assessHeadClaim(
  kind: HeadClaimKind,
  recordedHead: string,
  observedHead: string,
): HeadClaimAssessment {
  if (kind === 'historical') {
    return {
      conflict: false,
      recordedHead,
      observedHead,
      reason: 'historical HEAD records the repository state at artifact creation time',
    };
  }

  if (recordedHead === observedHead) {
    return {
      conflict: false,
      recordedHead,
      observedHead,
      reason: 'current HEAD claim matches observed repository state',
    };
  }

  return {
    conflict: true,
    recordedHead,
    observedHead,
    reason: 'current HEAD claim conflicts with observed repository state',
  };
}

export function phaseCompletionIsAuthorized(
  completedMilestones: readonly string[],
  requiredMilestones: readonly string[],
  explicitPhaseCompletion: boolean,
): boolean {
  if (!explicitPhaseCompletion) {
    return false;
  }

  const completed = new Set(completedMilestones);

  return requiredMilestones.every((milestone) => completed.has(milestone));
}

function requireAllowed(decision: PolicyDecision): void {
  if (!decision.allowed) {
    throw new Error(decision.reason ?? 'operational-memory transition denied');
  }
}

export function prepareSessionClose(
  session: OperationalMemorySession,
  artifacts: SessionArtifactState,
  closePreparation: string,
): OperationalMemorySession {
  requireAllowed(canPrepareSessionClose(session, artifacts));

  if (closePreparation.trim() === '') {
    throw new Error('session close preparation path must not be empty');
  }

  return {
    ...session,
    state: SESSION_STATES.closePrepared,
    closePreparation,
  };
}

export function cancelPreparedSessionClose(
  session: OperationalMemorySession,
  artifacts: SessionArtifactState,
): OperationalMemorySession {
  if (session.state !== SESSION_STATES.closePrepared) {
    throw new Error('canceling session close requires CLOSE_PREPARED state');
  }

  if (artifacts.closeoutExists) {
    throw new Error('closed-session closeout already exists');
  }

  return {
    schemaVersion: session.schemaVersion,
    id: session.id,
    state: SESSION_STATES.open,
    createdAt: session.createdAt,
    baseHead: session.baseHead,
  };
}

export function finalizeSessionClose(
  request: FinalizeSessionRequest,
  closedAt: string,
): OperationalMemorySession {
  requireAllowed(canFinalizeSessionClose(request));

  if (Number.isNaN(Date.parse(closedAt))) {
    throw new Error('session finalization closedAt must be a valid timestamp');
  }

  return {
    ...request.session,
    state: SESSION_STATES.closed,
    closedAt,
    closeout: 'close-session.md',
  };
}

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  allocateSessionId,
  assessHeadClaim,
  cancelPreparedSessionClose,
  canFinalizeSessionClose,
  canPrepareSessionClose,
  canWriteSessionArtifact,
  finalizeSessionClose,
  HUMAN_CLOSE_DECISIONS,
  phaseCompletionIsAuthorized,
  prepareSessionClose,
  SESSION_STATES,
  validateSessionManifest,
  type OperationalMemorySession,
} from '../../scripts/quality/operational-memory-policy.js';

const BASE_HEAD = 'd3d829bba41dead6cb9f4c05677ab2366fab6c99';
const repositoryRoot = process.cwd();
const operationalMemoryReadme = readFileSync(
  join(repositoryRoot, 'docs', 'project-memory', 'README.md'),
  'utf8',
);

function createOpenSession(
  overrides: Partial<OperationalMemorySession> = {},
): OperationalMemorySession {
  return {
    schemaVersion: 1,
    id: 'session-20261027-001',
    state: SESSION_STATES.open,
    createdAt: '2026-10-27T19:30:00Z',
    baseHead: BASE_HEAD,
    ...overrides,
  };
}

function createPreparedSession(
  overrides: Partial<OperationalMemorySession> = {},
): OperationalMemorySession {
  return {
    ...createOpenSession(),
    state: SESSION_STATES.closePrepared,
    closePreparation: 'architect/checkpoints/002-close-preparation.md',
    ...overrides,
  };
}

function createClosedSession(
  overrides: Partial<OperationalMemorySession> = {},
): OperationalMemorySession {
  return {
    ...createPreparedSession(),
    state: SESSION_STATES.closed,
    closedAt: '2026-10-27T20:30:00Z',
    closeout: 'close-session.md',
    ...overrides,
  };
}

describe('operational-memory session identity', () => {
  it('allocates the first session of a date', () => {
    expect(allocateSessionId('20261027', [])).toBe('session-20261027-001');
  });

  it('allocates sequential sessions on the same date', () => {
    expect(allocateSessionId('20261027', ['session-20261027-001', 'session-20261027-002'])).toBe(
      'session-20261027-003',
    );
  });

  it('ignores sessions from other dates', () => {
    expect(
      allocateSessionId('20261027', [
        'session-20261026-009',
        'session-20261027-001',
        'session-20261028-010',
      ]),
    ).toBe('session-20261027-002');
  });

  it('ignores legacy session IDs during allocation', () => {
    expect(allocateSessionId('20261027', ['session-20261027', 'legacy-session'])).toBe(
      'session-20261027-001',
    );
  });

  it('rejects an invalid date token', () => {
    expect(() => allocateSessionId('2026-10-27', [])).toThrow(/YYYYMMDD/);
  });

  it('rejects exhausted same-day sequences', () => {
    expect(() => allocateSessionId('20261027', ['session-20261027-999'])).toThrow(
      /sequence exhausted/,
    );
  });
});

describe('operational-memory session manifests', () => {
  it('accepts an OPEN session', () => {
    expect(validateSessionManifest(createOpenSession())).toEqual([]);
  });

  it('accepts a CLOSE_PREPARED session', () => {
    expect(validateSessionManifest(createPreparedSession())).toEqual([]);
  });

  it('accepts a CLOSED session', () => {
    expect(validateSessionManifest(createClosedSession())).toEqual([]);
  });

  it('rejects legacy session IDs', () => {
    expect(
      validateSessionManifest(
        createOpenSession({
          id: 'session-20261027',
        }),
      ),
    ).toContain('session id must use session-YYYYMMDD-NNN format');
  });

  it('rejects invalid timestamps', () => {
    expect(
      validateSessionManifest(
        createOpenSession({
          createdAt: 'not-a-timestamp',
        }),
      ),
    ).toContain('session createdAt must be a valid timestamp');
  });

  it('rejects invalid base HEAD values', () => {
    expect(
      validateSessionManifest(
        createOpenSession({
          baseHead: 'not-a-sha',
        }),
      ),
    ).toContain('session baseHead must be a Git SHA');
  });

  it('requires close preparation for CLOSE_PREPARED', () => {
    expect(
      validateSessionManifest(
        createPreparedSession({
          closePreparation: undefined,
        }),
      ),
    ).toContain('CLOSE_PREPARED session must reference close preparation');
  });

  it('requires complete close metadata for CLOSED', () => {
    const violations = validateSessionManifest(
      createClosedSession({
        closedAt: undefined,
        closeout: undefined,
      }),
    );

    expect(violations).toContain('CLOSED session must contain closedAt');
    expect(violations).toContain('CLOSED session must reference closeout');
  });

  it('rejects final close metadata in OPEN', () => {
    expect(
      validateSessionManifest(
        createOpenSession({
          closeout: 'close-session.md',
        }),
      ),
    ).toContain('OPEN session must not contain closed-session metadata');
  });
});

describe('operational-memory mutable artifacts', () => {
  it('allows a checkpoint in OPEN', () => {
    expect(canWriteSessionArtifact(createOpenSession(), 'checkpoint')).toEqual({
      allowed: true,
    });
  });

  it('allows a handoff in OPEN', () => {
    expect(canWriteSessionArtifact(createOpenSession(), 'handoff')).toEqual({
      allowed: true,
    });
  });

  it('rejects a checkpoint in CLOSE_PREPARED', () => {
    expect(canWriteSessionArtifact(createPreparedSession(), 'checkpoint')).toMatchObject({
      allowed: false,
    });
  });

  it('rejects a checkpoint in CLOSED', () => {
    expect(canWriteSessionArtifact(createClosedSession(), 'checkpoint')).toMatchObject({
      allowed: false,
    });
  });

  it('rejects a handoff in CLOSED', () => {
    expect(canWriteSessionArtifact(createClosedSession(), 'handoff')).toMatchObject({
      allowed: false,
    });
  });

  it('rejects unsupported session schema versions', () => {
    const session = {
      ...createOpenSession(),
      schemaVersion: 2,
    } as unknown as OperationalMemorySession;

    expect(validateSessionManifest(session)).toContain('session schemaVersion must be 1');
  });

  it('rejects close preparation metadata in OPEN', () => {
    expect(
      validateSessionManifest(
        createOpenSession({
          closePreparation: 'architect/checkpoints/001-close-preparation.md',
        }),
      ),
    ).toContain('OPEN session must not reference close preparation');
  });

  it('rejects final close metadata in CLOSE_PREPARED', () => {
    expect(
      validateSessionManifest(
        createPreparedSession({
          closedAt: '2026-10-27T20:30:00Z',
          closeout: 'close-session.md',
        }),
      ),
    ).toContain('CLOSE_PREPARED session must not contain final closeout metadata');
  });

  it('requires close preparation for CLOSED', () => {
    expect(
      validateSessionManifest(
        createClosedSession({
          closePreparation: undefined,
        }),
      ),
    ).toContain('CLOSED session must reference close preparation');
  });

  it('rejects an invalid CLOSED timestamp', () => {
    expect(
      validateSessionManifest(
        createClosedSession({
          closedAt: 'not-a-timestamp',
        }),
      ),
    ).toContain('CLOSED session closedAt must be a valid timestamp');
  });
});

describe('operational-memory close preparation', () => {
  it('allows preparing an OPEN session', () => {
    expect(
      canPrepareSessionClose(createOpenSession(), {
        closePreparationExists: false,
        closeoutExists: false,
      }),
    ).toEqual({
      allowed: true,
    });
  });

  it('allows a new preparation after a canceled preparation became historical', () => {
    expect(
      canPrepareSessionClose(createOpenSession(), {
        closePreparationExists: true,
        closeoutExists: false,
      }),
    ).toEqual({
      allowed: true,
    });
  });

  it('rejects preparing a session that is already CLOSE_PREPARED', () => {
    expect(
      canPrepareSessionClose(createPreparedSession(), {
        closePreparationExists: true,
        closeoutExists: false,
      }),
    ).toMatchObject({
      allowed: false,
      reason: 'session close preparation requires an OPEN session',
    });
  });

  it('rejects close preparation when closeout exists', () => {
    expect(
      canPrepareSessionClose(createOpenSession(), {
        closePreparationExists: false,
        closeoutExists: true,
      }),
    ).toMatchObject({
      allowed: false,
      reason: 'closed-session closeout already exists',
    });
  });

  it('rejects preparing a CLOSED session', () => {
    expect(
      canPrepareSessionClose(createClosedSession(), {
        closePreparationExists: true,
        closeoutExists: true,
      }),
    ).toMatchObject({
      allowed: false,
    });
  });
});

describe('operational-memory finalization', () => {
  it('allows Human-confirmed finalization', () => {
    expect(
      canFinalizeSessionClose({
        session: createPreparedSession(),
        artifacts: {
          closePreparationExists: true,
          closeoutExists: false,
        },
        humanDecision: HUMAN_CLOSE_DECISIONS.confirmClose,
      }),
    ).toEqual({
      allowed: true,
    });
  });

  it('allows closing with pending items', () => {
    expect(
      canFinalizeSessionClose({
        session: createPreparedSession(),
        artifacts: {
          closePreparationExists: true,
          closeoutExists: false,
        },
        humanDecision: HUMAN_CLOSE_DECISIONS.closeWithPendingItems,
      }),
    ).toEqual({
      allowed: true,
    });
  });

  it('rejects finalization without close preparation state', () => {
    expect(
      canFinalizeSessionClose({
        session: createOpenSession(),
        artifacts: {
          closePreparationExists: false,
          closeoutExists: false,
        },
        humanDecision: HUMAN_CLOSE_DECISIONS.confirmClose,
      }),
    ).toMatchObject({
      allowed: false,
    });
  });

  it('rejects finalization without preparation evidence', () => {
    expect(
      canFinalizeSessionClose({
        session: createPreparedSession(),
        artifacts: {
          closePreparationExists: false,
          closeoutExists: false,
        },
        humanDecision: HUMAN_CLOSE_DECISIONS.confirmClose,
      }),
    ).toMatchObject({
      allowed: false,
    });
  });

  it('rejects finalization without a Human decision', () => {
    expect(
      canFinalizeSessionClose({
        session: createPreparedSession(),
        artifacts: {
          closePreparationExists: true,
          closeoutExists: false,
        },
      }),
    ).toMatchObject({
      allowed: false,
      reason: 'session finalization requires an explicit Human close decision',
    });
  });

  it('honors Human cancellation', () => {
    expect(
      canFinalizeSessionClose({
        session: createPreparedSession(),
        artifacts: {
          closePreparationExists: true,
          closeoutExists: false,
        },
        humanDecision: HUMAN_CLOSE_DECISIONS.cancelClose,
      }),
    ).toMatchObject({
      allowed: false,
      reason: 'Human canceled the prepared session close',
    });
  });

  it('rejects overwriting an existing closeout', () => {
    expect(
      canFinalizeSessionClose({
        session: createPreparedSession(),
        artifacts: {
          closePreparationExists: true,
          closeoutExists: true,
        },
        humanDecision: HUMAN_CLOSE_DECISIONS.confirmClose,
      }),
    ).toMatchObject({
      allowed: false,
      reason: 'session closeout already exists and is immutable',
    });
  });

  it('rejects finalizing a CLOSED session again', () => {
    expect(
      canFinalizeSessionClose({
        session: createClosedSession(),
        artifacts: {
          closePreparationExists: true,
          closeoutExists: true,
        },
        humanDecision: HUMAN_CLOSE_DECISIONS.confirmClose,
      }),
    ).toMatchObject({
      allowed: false,
    });
  });
});

describe('operational-memory state transitions', () => {
  it('transitions OPEN to CLOSE_PREPARED', () => {
    expect(
      prepareSessionClose(
        createOpenSession(),
        {
          closePreparationExists: false,
          closeoutExists: false,
        },
        'architect/checkpoints/002-close-preparation.md',
      ),
    ).toEqual(createPreparedSession());
  });

  it('rejects an empty close-preparation path', () => {
    expect(() =>
      prepareSessionClose(
        createOpenSession(),
        {
          closePreparationExists: false,
          closeoutExists: false,
        },
        '   ',
      ),
    ).toThrow(/must not be empty/);
  });

  it('returns CLOSE_PREPARED to OPEN after Human cancellation', () => {
    expect(
      cancelPreparedSessionClose(createPreparedSession(), {
        closePreparationExists: true,
        closeoutExists: false,
      }),
    ).toEqual(createOpenSession());
  });

  it('preserves a canceled preparation as historical evidence without blocking another preparation', () => {
    const reopened = cancelPreparedSessionClose(createPreparedSession(), {
      closePreparationExists: true,
      closeoutExists: false,
    });

    expect(
      canPrepareSessionClose(reopened, {
        closePreparationExists: true,
        closeoutExists: false,
      }),
    ).toEqual({
      allowed: true,
    });
  });

  it('rejects cancellation after a closeout exists', () => {
    expect(() =>
      cancelPreparedSessionClose(createPreparedSession(), {
        closePreparationExists: true,
        closeoutExists: true,
      }),
    ).toThrow(/closeout already exists/);
  });

  it('transitions CLOSE_PREPARED to CLOSED after Human confirmation', () => {
    expect(
      finalizeSessionClose(
        {
          session: createPreparedSession(),
          artifacts: {
            closePreparationExists: true,
            closeoutExists: false,
          },
          humanDecision: HUMAN_CLOSE_DECISIONS.confirmClose,
        },
        '2026-10-27T20:30:00Z',
      ),
    ).toEqual(createClosedSession());
  });

  it('rejects invalid finalization timestamps', () => {
    expect(() =>
      finalizeSessionClose(
        {
          session: createPreparedSession(),
          artifacts: {
            closePreparationExists: true,
            closeoutExists: false,
          },
          humanDecision: HUMAN_CLOSE_DECISIONS.confirmClose,
        },
        'invalid',
      ),
    ).toThrow(/valid timestamp/);
  });

  it('rejects preparing a close through the transition when the session is not OPEN', () => {
    expect(() =>
      prepareSessionClose(
        createClosedSession(),
        {
          closePreparationExists: true,
          closeoutExists: true,
        },
        'architect/checkpoints/003-close-preparation.md',
      ),
    ).toThrow(/session close preparation requires an OPEN session/);
  });

  it('rejects cancellation when the session is not CLOSE_PREPARED', () => {
    expect(() =>
      cancelPreparedSessionClose(createOpenSession(), {
        closePreparationExists: false,
        closeoutExists: false,
      }),
    ).toThrow(/canceling session close requires CLOSE_PREPARED state/);
  });
});

describe('historical and current HEAD claims', () => {
  it('does not treat historical HEAD as stale by itself', () => {
    expect(assessHeadClaim('historical', '875d936', 'd3d829b')).toMatchObject({
      conflict: false,
    });
  });

  it('accepts a matching current HEAD claim', () => {
    expect(assessHeadClaim('current', 'd3d829b', 'd3d829b')).toMatchObject({
      conflict: false,
    });
  });

  it('reports a conflicting current HEAD claim', () => {
    expect(assessHeadClaim('current', '875d936', 'd3d829b')).toMatchObject({
      conflict: true,
    });
  });
});

describe('phase completion authority', () => {
  const requiredMilestones = ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6'];

  it('does not infer Phase completion from one milestone', () => {
    expect(phaseCompletionIsAuthorized(['4.1', '4.2', '4.3'], requiredMilestones, true)).toBe(
      false,
    );
  });

  it('requires explicit Phase completion authority', () => {
    expect(phaseCompletionIsAuthorized(requiredMilestones, requiredMilestones, false)).toBe(false);
  });

  it('allows completion only with all milestones and explicit authority', () => {
    expect(phaseCompletionIsAuthorized(requiredMilestones, requiredMilestones, true)).toBe(true);
  });
});

describe('operational-memory documented lifecycle', () => {
  it('documents the three governed session states', () => {
    expect(operationalMemoryReadme).toContain('session-YYYYMMDD-NNN');
    expect(operationalMemoryReadme).toContain('OPEN');
    expect(operationalMemoryReadme).toContain('CLOSE_PREPARED');
    expect(operationalMemoryReadme).toContain('CLOSED');
  });

  it('documents the two-phase close protocol', () => {
    expect(operationalMemoryReadme).toContain('`/close-session` prepares closure');
    expect(operationalMemoryReadme).toContain('It does not write `close-session.md`.');
    expect(operationalMemoryReadme).toContain(
      '`/finalize-session` consumes that explicit Human decision',
    );
  });

  it('documents closed-session immutability', () => {
    expect(operationalMemoryReadme).toContain('`close-session.md` has been written exactly once.');
    expect(operationalMemoryReadme).toContain('The session is immutable.');
    expect(operationalMemoryReadme).toContain('Later evidence starts a new session.');
  });

  it('documents historical HEAD semantics', () => {
    expect(operationalMemoryReadme).toContain(
      'Branch and HEAD values inside checkpoints and closeouts describe repository',
    );
    expect(operationalMemoryReadme).toContain(
      'A later commit, merge, promotion, or memory-integration change does not make',
    );
  });
});

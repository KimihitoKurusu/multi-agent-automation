import { describe, expect, it } from 'vitest';

import {
  branchNameFromRef,
  classifyBranch,
  parsePushRefUpdate,
  pushedBranchNames,
  ZERO_GIT_SHA,
} from '../../scripts/quality/branch-policy.js';

describe('branch policy', () => {
  it.each([
    ['main', 'production'],
    ['test', 'integration'],
    ['form-interaction/common', 'leader'],
    ['form-interaction/text-input', 'developer'],
    ['browser-runtime/control-lease', 'developer'],
    ['governance/opencode-agents', 'governance'],
    ['governance/quality-policy', 'governance'],
  ])('accepts %s as %s', (branch, kind) => {
    expect(classifyBranch(branch)).toMatchObject({
      valid: true,
      branch,
      kind,
    });
  });

  it.each([
    'form-interaction',
    'form-interaction/common/extra',
    'form-interaction/text-input/common',
    'Form-Interaction/common',
    'form_interaction/common',
    'form interaction/common',
    'form-interaction/Common',
    'common/foo',
    'governance/common',
    'governance/foo/bar',
    'governance/',
    'Governance/foo',
  ])('rejects invalid branch %s', (branch) => {
    expect(classifyBranch(branch)).toMatchObject({
      valid: false,
      branch,
    });
  });

  it('extracts the feature from a Leader branch', () => {
    expect(classifyBranch('policy-engine/common')).toEqual({
      valid: true,
      branch: 'policy-engine/common',
      kind: 'leader',
      feature: 'policy-engine',
    });
  });

  it('extracts feature and task from a Developer branch', () => {
    expect(classifyBranch('policy-engine/rule-evaluator')).toEqual({
      valid: true,
      branch: 'policy-engine/rule-evaluator',
      kind: 'developer',
      feature: 'policy-engine',
      task: 'rule-evaluator',
    });
  });
});

describe('pre-push ref policy', () => {
  it('parses a pre-push ref update', () => {
    expect(
      parsePushRefUpdate('refs/heads/test aaa refs/heads/form-interaction/common bbb'),
    ).toEqual({
      localRef: 'refs/heads/test',
      localSha: 'aaa',
      remoteRef: 'refs/heads/form-interaction/common',
      remoteSha: 'bbb',
    });
  });

  it('rejects malformed pre-push input', () => {
    expect(() => parsePushRefUpdate('refs/heads/test aaa refs/heads/test')).toThrow(
      /expected local ref, local SHA, remote ref and remote SHA/,
    );
  });

  it('extracts branch names from branch refs', () => {
    expect(branchNameFromRef('refs/heads/form-interaction/common')).toBe('form-interaction/common');
  });

  it('ignores non-branch refs', () => {
    expect(branchNameFromRef('refs/tags/v1.0.0')).toBeUndefined();
  });

  it('validates both distinct local and remote branch names', () => {
    expect(
      pushedBranchNames({
        localRef: 'refs/heads/test',
        localSha: 'aaa',
        remoteRef: 'refs/heads/form-interaction/common',
        remoteSha: 'bbb',
      }),
    ).toEqual(['test', 'form-interaction/common']);
  });

  it('deduplicates equal local and remote branch names', () => {
    expect(
      pushedBranchNames({
        localRef: 'refs/heads/test',
        localSha: 'aaa',
        remoteRef: 'refs/heads/test',
        remoteSha: 'bbb',
      }),
    ).toEqual(['test']);
  });

  it('ignores tag destinations while retaining the local branch', () => {
    expect(
      pushedBranchNames({
        localRef: 'refs/heads/test',
        localSha: 'aaa',
        remoteRef: 'refs/tags/adversarial-tag',
        remoteSha: 'bbb',
      }),
    ).toEqual(['test']);
  });

  it('skips branch naming checks for ref deletion', () => {
    expect(
      pushedBranchNames({
        localRef: 'refs/heads/test',
        localSha: ZERO_GIT_SHA,
        remoteRef: 'refs/heads/test',
        remoteSha: 'bbb',
      }),
    ).toEqual([]);
  });
});

it('extracts the task from a Governance branch', () => {
  expect(classifyBranch('governance/opencode-agents')).toEqual({
    valid: true,
    branch: 'governance/opencode-agents',
    kind: 'governance',
    task: 'opencode-agents',
  });
});

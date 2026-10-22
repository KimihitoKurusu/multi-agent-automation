import { describe, expect, it } from 'vitest';

import { classifyBranch } from '../../scripts/quality/branch-policy.js';

describe('branch policy', () => {
  it.each([
    ['main', 'production'],
    ['test', 'integration'],
    ['form-interaction/common', 'leader'],
    ['form-interaction/text-input', 'developer'],
    ['browser-runtime/control-lease', 'developer'],
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

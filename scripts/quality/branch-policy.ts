export const BRANCH_KINDS = {
  production: 'production',
  integration: 'integration',
  leader: 'leader',
  developer: 'developer',
} as const;

export type BranchKind = (typeof BRANCH_KINDS)[keyof typeof BRANCH_KINDS];

export interface ValidBranch {
  valid: true;
  branch: string;
  kind: BranchKind;
  feature?: string;
  task?: string;
}

export interface InvalidBranch {
  valid: false;
  branch: string;
  reason: string;
}

export type BranchValidation = ValidBranch | InvalidBranch;

const TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_TOKEN = 'common';

export function classifyBranch(branch: string): BranchValidation {
  if (branch === 'main') {
    return {
      valid: true,
      branch,
      kind: BRANCH_KINDS.production,
    };
  }

  if (branch === 'test') {
    return {
      valid: true,
      branch,
      kind: BRANCH_KINDS.integration,
    };
  }

  const parts = branch.split('/');

  if (parts.length !== 2) {
    return {
      valid: false,
      branch,
      reason: 'governed feature branches must use exactly <feature>/<task>',
    };
  }

  const [feature, task] = parts;

  if (
    feature === undefined ||
    task === undefined ||
    !TOKEN_PATTERN.test(feature) ||
    !TOKEN_PATTERN.test(task)
  ) {
    return {
      valid: false,
      branch,
      reason: 'feature and task tokens must use lowercase ASCII kebab-case',
    };
  }

  if (feature === RESERVED_TOKEN) {
    return {
      valid: false,
      branch,
      reason: 'common is reserved and cannot be used as a feature token',
    };
  }

  if (task === RESERVED_TOKEN) {
    return {
      valid: true,
      branch,
      kind: BRANCH_KINDS.leader,
      feature,
    };
  }

  return {
    valid: true,
    branch,
    kind: BRANCH_KINDS.developer,
    feature,
    task,
  };
}

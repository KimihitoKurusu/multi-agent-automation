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

export const ZERO_GIT_SHA = '0000000000000000000000000000000000000000';

export interface PushRefUpdate {
  localRef: string;
  localSha: string;
  remoteRef: string;
  remoteSha: string;
}

export function parsePushRefUpdate(line: string): PushRefUpdate {
  const fields = line.trim().split(/\s+/);

  if (fields.length !== 4) {
    throw new Error(
      'invalid pre-push input: expected local ref, local SHA, remote ref and remote SHA',
    );
  }

  const [localRef, localSha, remoteRef, remoteSha] = fields;

  if (
    localRef === undefined ||
    localSha === undefined ||
    remoteRef === undefined ||
    remoteSha === undefined
  ) {
    throw new Error('invalid pre-push input: missing ref update field');
  }

  return {
    localRef,
    localSha,
    remoteRef,
    remoteSha,
  };
}

export function branchNameFromRef(ref: string): string | undefined {
  const prefix = 'refs/heads/';

  if (!ref.startsWith(prefix)) {
    return undefined;
  }

  return ref.slice(prefix.length);
}

export function pushedBranchNames(update: PushRefUpdate): string[] {
  if (update.localSha === ZERO_GIT_SHA) {
    return [];
  }

  const names = [branchNameFromRef(update.localRef), branchNameFromRef(update.remoteRef)].filter(
    (name): name is string => name !== undefined,
  );

  return [...new Set(names)];
}

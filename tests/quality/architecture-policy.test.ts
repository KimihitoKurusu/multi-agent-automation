import { describe, expect, it } from 'vitest';

import {
  APPROVED_WORKSPACE_PATTERNS,
  usesWorkspaceProtocol,
  validateInternalDependencies,
  validateUniquePackageNames,
  validateWorkspacePatterns,
  type WorkspacePackage,
} from '../../scripts/quality/architecture-policy.js';

function workspacePackage(
  directory: string,
  name: string | undefined,
  dependencies?: Record<string, string>,
): WorkspacePackage {
  return {
    directory,
    manifestPath: `${directory}/package.json`,
    manifest: {
      ...(name === undefined ? {} : { name }),
      ...(dependencies === undefined ? {} : { dependencies }),
    },
  };
}

describe('architecture policy', () => {
  it.each(['workspace:*', 'workspace:^', 'workspace:~', 'workspace:^1.0.0'])(
    'recognizes %s as a workspace dependency',
    (version) => {
      expect(usesWorkspaceProtocol(version)).toBe(true);
    },
  );

  it.each(['*', '^1.0.0', '1.0.0', 'latest'])(
    'rejects %s as an explicit workspace dependency',
    (version) => {
      expect(usesWorkspaceProtocol(version)).toBe(false);
    },
  );

  it('accepts unique workspace package names', () => {
    const packages = [
      workspacePackage('packages/contracts', '@multi-agent/contracts'),
      workspacePackage('apps/orchestrator', '@multi-agent/orchestrator'),
    ];

    expect(validateUniquePackageNames(packages)).toEqual([]);
  });

  it('requires workspace packages to declare a name', () => {
    const packages = [workspacePackage('packages/contracts', undefined)];

    expect(validateUniquePackageNames(packages)).toMatchObject([
      {
        code: 'PACKAGE_NAME_REQUIRED',
        path: 'packages/contracts/package.json',
      },
    ]);
  });

  it('rejects duplicate workspace package names', () => {
    const packages = [
      workspacePackage('packages/contracts', '@multi-agent/contracts'),
      workspacePackage('packages/other', '@multi-agent/contracts'),
    ];

    expect(validateUniquePackageNames(packages)).toMatchObject([
      {
        code: 'DUPLICATE_PACKAGE_NAME',
        path: 'packages/other/package.json',
      },
    ]);
  });

  it('accepts local dependencies using workspace protocol', () => {
    const packages = [
      workspacePackage('packages/contracts', '@multi-agent/contracts'),
      workspacePackage('apps/orchestrator', '@multi-agent/orchestrator', {
        '@multi-agent/contracts': 'workspace:*',
      }),
    ];

    expect(validateInternalDependencies(packages)).toEqual([]);
  });

  it('rejects local dependencies using registry ranges', () => {
    const packages = [
      workspacePackage('packages/contracts', '@multi-agent/contracts'),
      workspacePackage('apps/orchestrator', '@multi-agent/orchestrator', {
        '@multi-agent/contracts': '^1.0.0',
      }),
    ];

    expect(validateInternalDependencies(packages)).toMatchObject([
      {
        code: 'LOCAL_DEPENDENCY_REQUIRES_WORKSPACE_PROTOCOL',
        path: 'apps/orchestrator/package.json',
      },
    ]);
  });

  it('ignores external registry dependencies', () => {
    const packages = [
      workspacePackage('apps/orchestrator', '@multi-agent/orchestrator', {
        zod: '^4.0.0',
      }),
    ];

    expect(validateInternalDependencies(packages)).toEqual([]);
  });
});

it('accepts the approved workspace topology', () => {
  expect(validateWorkspacePatterns([...APPROVED_WORKSPACE_PATTERNS])).toEqual([]);
});

it('rejects a missing workspace root', () => {
  expect(validateWorkspacePatterns(['apps/*', 'packages/*'])).toMatchObject([
    {
      code: 'REQUIRED_WORKSPACE_PATTERN_MISSING',
      path: 'pnpm-workspace.yaml',
    },
  ]);
});

it('rejects an unapproved workspace root', () => {
  expect(validateWorkspacePatterns([...APPROVED_WORKSPACE_PATTERNS, 'services/*'])).toMatchObject([
    {
      code: 'UNAPPROVED_WORKSPACE_PATTERN',
      path: 'pnpm-workspace.yaml',
    },
  ]);
});

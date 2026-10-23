import { describe, expect, it } from 'vitest';

import {
  evaluateProtectedGovernanceChange,
  findProtectedGovernancePaths,
  isProtectedGovernancePath,
  normalizeRepositoryPath,
  parseGitNameStatus,
} from '../../scripts/quality/protected-governance.js';

describe('protected governance policy', () => {
  it.each([
    'AGENTS.md',
    'SECURITY.md',
    'CONTRIBUTING.md',
    'docs/architecture/PROJECT_CHARTER.md',
    'docs/adr/README.md',
    'docs/adr/ADR-TEMPLATE.md',
    'docs/adr/ADR-0004-git-branching-and-promotion.md',
    '.husky/pre-commit',
    '.husky/commit-msg',
    '.husky/pre-push',
    'eslint.config.js',
    'commitlint.config.js',
    'vitest.config.ts',
    '.prettierrc.json',
    '.prettierignore',
    'scripts/quality/branch-policy.ts',
    'tests/quality/branch-policy.test.ts',
    '.gitleaks.toml',
    '.github/workflows/quality.yml',
  ])('protects %s', (path) => {
    expect(isProtectedGovernancePath(path)).toBe(true);
  });

  it.each([
    'README.md',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'tsconfig.json',
    'tsconfig.base.json',
    'scripts/bootstrap/environment.ts',
    'apps/web/src/index.ts',
    'packages/contracts/src/index.ts',
    'mcp/browser/src/server.ts',
  ])('does not classify %s as protected governance', (path) => {
    expect(isProtectedGovernancePath(path)).toBe(false);
  });

  it('normalizes Windows separators', () => {
    expect(normalizeRepositoryPath('docs\\adr\\ADR-0006-shared-browser-control.md')).toBe(
      'docs/adr/ADR-0006-shared-browser-control.md',
    );
  });

  it('returns only protected paths in deterministic order', () => {
    expect(
      findProtectedGovernancePaths([
        'packages/contracts/src/index.ts',
        'SECURITY.md',
        'scripts/quality/branch-policy.ts',
        'README.md',
        'AGENTS.md',
      ]),
    ).toEqual(['AGENTS.md', 'scripts/quality/branch-policy.ts', 'SECURITY.md']);
  });
});

export interface ProtectedGovernanceDecision {
  allowed: boolean;
  branch: string;
  protectedPaths: string[];
  reason?: string;
}

describe('protected governance change authorization', () => {
  it('allows ordinary implementation files on a Developer branch', () => {
    expect(
      evaluateProtectedGovernanceChange('form-interaction/text-input', ['apps/web/src/index.ts']),
    ).toMatchObject({
      allowed: true,
      protectedPaths: [],
    });
  });

  it('rejects protected governance on a Developer branch', () => {
    expect(
      evaluateProtectedGovernanceChange('form-interaction/text-input', [
        'apps/web/src/index.ts',
        'SECURITY.md',
      ]),
    ).toEqual({
      allowed: false,
      branch: 'form-interaction/text-input',
      protectedPaths: ['SECURITY.md'],
      reason: 'protected governance changes are restricted to the governed test baseline',
    });
  });

  it('rejects protected governance on a Leader branch', () => {
    expect(
      evaluateProtectedGovernanceChange('form-interaction/common', ['AGENTS.md']),
    ).toMatchObject({
      allowed: false,
      protectedPaths: ['AGENTS.md'],
    });
  });

  it('allows protected governance on test', () => {
    expect(
      evaluateProtectedGovernanceChange('test', ['AGENTS.md', 'docs/adr/ADR-0007-example.md']),
    ).toEqual({
      allowed: true,
      branch: 'test',
      protectedPaths: ['AGENTS.md', 'docs/adr/ADR-0007-example.md'],
    });
  });

  it('rejects protected governance directly on main', () => {
    expect(evaluateProtectedGovernanceChange('main', ['SECURITY.md'])).toMatchObject({
      allowed: false,
      protectedPaths: ['SECURITY.md'],
    });
  });
});

describe('git staged path parsing', () => {
  it('parses added modified and deleted paths', () => {
    expect(
      parseGitNameStatus(
        [
          'A',
          'apps/web/src/new.ts',
          'M',
          'packages/contracts/src/index.ts',
          'D',
          'scripts/quality/branch-policy.ts',
          '',
        ].join('\0'),
      ),
    ).toEqual([
      'apps/web/src/new.ts',
      'packages/contracts/src/index.ts',
      'scripts/quality/branch-policy.ts',
    ]);
  });

  it('preserves both sides of a rename', () => {
    expect(
      parseGitNameStatus(
        [
          'R100',
          'scripts/quality/branch-policy.ts',
          'scripts/bootstrap/renamed-policy.ts',
          '',
        ].join('\0'),
      ),
    ).toEqual(['scripts/quality/branch-policy.ts', 'scripts/bootstrap/renamed-policy.ts']);
  });

  it('preserves both sides of a copy', () => {
    expect(
      parseGitNameStatus(
        ['C100', 'scripts/quality/branch-policy.ts', 'scripts/bootstrap/copied-policy.ts', ''].join(
          '\0',
        ),
      ),
    ).toEqual(['scripts/quality/branch-policy.ts', 'scripts/bootstrap/copied-policy.ts']);
  });

  it('returns no paths for empty git output', () => {
    expect(parseGitNameStatus('')).toEqual([]);
  });

  it('rejects malformed rename output', () => {
    expect(() =>
      parseGitNameStatus(['R100', 'scripts/quality/branch-policy.ts', ''].join('\0')),
    ).toThrow(/requires source and destination paths/);
  });
  it('rejects a missing status field', () => {
    expect(() => parseGitNameStatus('\0')).toThrow(/missing status/);
  });

  it('rejects a non-rename status without a path', () => {
    expect(() => parseGitNameStatus('M')).toThrow(/M requires a path/);
  });
});

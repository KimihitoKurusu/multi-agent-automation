const EXACT_PROTECTED_PATHS = new Set([
  'AGENTS.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'docs/architecture/PROJECT_CHARTER.md',
  'docs/adr/README.md',
  'docs/adr/ADR-TEMPLATE.md',
  'eslint.config.js',
  'commitlint.config.js',
  'vitest.config.ts',
  '.prettierrc.json',
  '.prettierignore',
  '.gitleaks.toml',
]);

const PROTECTED_PREFIXES = [
  'docs/adr/ADR-',
  '.github/workflows/',
  '.husky/',
  'scripts/quality/',
  'tests/quality/',
] as const;

export function normalizeRepositoryPath(path: string): string {
  return path.replaceAll('\\', '/');
}

export function isProtectedGovernancePath(path: string): boolean {
  const normalized = normalizeRepositoryPath(path);

  if (EXACT_PROTECTED_PATHS.has(normalized)) {
    return true;
  }

  return PROTECTED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function findProtectedGovernancePaths(paths: readonly string[]): string[] {
  return paths
    .map(normalizeRepositoryPath)
    .filter(isProtectedGovernancePath)
    .sort((a, b) => a.localeCompare(b));
}

export interface ProtectedGovernanceDecision {
  allowed: boolean;
  branch: string;
  protectedPaths: string[];
  reason?: string;
}

export function evaluateProtectedGovernanceChange(
  branch: string,
  stagedPaths: readonly string[],
): ProtectedGovernanceDecision {
  const protectedPaths = findProtectedGovernancePaths(stagedPaths);

  if (protectedPaths.length === 0) {
    return {
      allowed: true,
      branch,
      protectedPaths,
    };
  }

  if (branch === 'test') {
    return {
      allowed: true,
      branch,
      protectedPaths,
    };
  }

  return {
    allowed: false,
    branch,
    protectedPaths,
    reason: 'protected governance changes are restricted to the governed test baseline',
  };
}

export function parseGitNameStatus(output: string): string[] {
  if (output === '') {
    return [];
  }

  const fields = output.split('\0');

  if (fields.at(-1) === '') {
    fields.pop();
  }

  const paths: string[] = [];

  for (let index = 0; index < fields.length;) {
    const status = fields[index];

    if (status === undefined || status === '') {
      throw new Error('invalid git name-status output: missing status');
    }

    index += 1;

    const changeType = status[0];

    if (changeType === 'R' || changeType === 'C') {
      const source = fields[index];
      const destination = fields[index + 1];

      if (source === undefined || destination === undefined) {
        throw new Error(
          `invalid git name-status output: ${changeType} requires source and destination paths`,
        );
      }

      paths.push(source, destination);
      index += 2;
      continue;
    }

    const path = fields[index];

    if (path === undefined) {
      throw new Error(`invalid git name-status output: ${status} requires a path`);
    }

    paths.push(path);
    index += 1;
  }

  return paths;
}

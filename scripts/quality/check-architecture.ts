import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { parse } from 'yaml';

import {
  APPROVED_WORKSPACE_PATTERNS,
  validateInternalDependencies,
  validateUniquePackageNames,
  validateWorkspacePatterns,
  type ArchitectureViolation,
  type PackageManifest,
  type WorkspacePackage,
} from './architecture-policy.js';

interface WorkspaceFile {
  packages?: unknown;
}

const repositoryRoot = process.cwd();

function repositoryPath(path: string): string {
  return path.replaceAll('\\', '/');
}

function readJson(path: string): PackageManifest {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageManifest;
}

function discoverWorkspacePackages(): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];

  for (const root of APPROVED_WORKSPACE_PATTERNS) {
    const rootDirectory = root.slice(0, -2);
    const absoluteRoot = resolve(repositoryRoot, rootDirectory);

    let entries;

    try {
      entries = readdirSync(absoluteRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const directory = join(absoluteRoot, entry.name);
      const manifestPath = join(directory, 'package.json');

      try {
        if (!statSync(manifestPath).isFile()) {
          continue;
        }
      } catch {
        continue;
      }

      packages.push({
        directory: repositoryPath(relative(repositoryRoot, directory)),
        manifestPath: repositoryPath(relative(repositoryRoot, manifestPath)),
        manifest: readJson(manifestPath),
      });
    }
  }

  return packages.sort((left, right) => left.manifestPath.localeCompare(right.manifestPath));
}

function validateWorkspaceFile(): ArchitectureViolation[] {
  const workspacePath = resolve(repositoryRoot, 'pnpm-workspace.yaml');
  const workspace = parse(readFileSync(workspacePath, 'utf8')) as WorkspaceFile;

  if (!Array.isArray(workspace.packages)) {
    return [
      {
        code: 'WORKSPACE_PACKAGES_REQUIRED',
        path: 'pnpm-workspace.yaml',
        message: 'pnpm-workspace.yaml must define a packages array',
      },
    ];
  }

  const patterns = workspace.packages.filter((value): value is string => typeof value === 'string');

  if (patterns.length !== workspace.packages.length) {
    return [
      {
        code: 'WORKSPACE_PATTERN_INVALID',
        path: 'pnpm-workspace.yaml',
        message: 'all workspace package patterns must be strings',
      },
    ];
  }

  return validateWorkspacePatterns(patterns);
}

function validateCompetingLockfiles(): ArchitectureViolation[] {
  const candidates = ['package-lock.json', 'yarn.lock', 'bun.lock', 'bun.lockb'];

  return candidates
    .filter((path) => {
      try {
        return statSync(resolve(repositoryRoot, path)).isFile();
      } catch {
        return false;
      }
    })
    .map((path) => ({
      code: 'COMPETING_NODE_LOCKFILE',
      path,
      message: `${path} is not an approved Node.js lockfile for this workspace`,
    }));
}

const packages = discoverWorkspacePackages();

const violations = [
  ...validateWorkspaceFile(),
  ...validateCompetingLockfiles(),
  ...validateUniquePackageNames(packages),
  ...validateInternalDependencies(packages),
].sort((left, right) => {
  const byPath = left.path.localeCompare(right.path);

  if (byPath !== 0) {
    return byPath;
  }

  return left.code.localeCompare(right.code);
});

if (violations.length > 0) {
  console.error('Architecture validation failed:');

  for (const violation of violations) {
    console.error(`- [${violation.code}] ${violation.path}: ${violation.message}`);
  }

  process.exitCode = 1;
} else {
  console.log(`Architecture validation passed (${packages.length} workspace packages).`);
}

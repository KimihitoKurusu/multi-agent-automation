export const WORKSPACE_PACKAGE_ROOTS = ['apps', 'packages', 'mcp'] as const;

export const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

export type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

export interface PackageManifest {
  name?: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface WorkspacePackage {
  directory: string;
  manifestPath: string;
  manifest: PackageManifest;
}

export interface ArchitectureViolation {
  code: string;
  path: string;
  message: string;
}

export function usesWorkspaceProtocol(version: string): boolean {
  return version.startsWith('workspace:');
}

export function validateUniquePackageNames(
  packages: readonly WorkspacePackage[],
): ArchitectureViolation[] {
  const owners = new Map<string, string>();
  const violations: ArchitectureViolation[] = [];

  for (const workspacePackage of packages) {
    const name = workspacePackage.manifest.name;

    if (name === undefined) {
      violations.push({
        code: 'PACKAGE_NAME_REQUIRED',
        path: workspacePackage.manifestPath,
        message: 'workspace packages must declare a package name',
      });

      continue;
    }

    const existingOwner = owners.get(name);

    if (existingOwner !== undefined) {
      violations.push({
        code: 'DUPLICATE_PACKAGE_NAME',
        path: workspacePackage.manifestPath,
        message: `package name "${name}" is already used by ${existingOwner}`,
      });

      continue;
    }

    owners.set(name, workspacePackage.manifestPath);
  }

  return violations;
}

export function validateInternalDependencies(
  packages: readonly WorkspacePackage[],
): ArchitectureViolation[] {
  const localNames = new Set(
    packages
      .map((workspacePackage) => workspacePackage.manifest.name)
      .filter((name): name is string => name !== undefined),
  );

  const violations: ArchitectureViolation[] = [];

  for (const workspacePackage of packages) {
    for (const field of DEPENDENCY_FIELDS) {
      const dependencies = workspacePackage.manifest[field];

      if (dependencies === undefined) {
        continue;
      }

      for (const [dependencyName, version] of Object.entries(dependencies)) {
        if (!localNames.has(dependencyName)) {
          continue;
        }

        if (usesWorkspaceProtocol(version)) {
          continue;
        }

        violations.push({
          code: 'LOCAL_DEPENDENCY_REQUIRES_WORKSPACE_PROTOCOL',
          path: workspacePackage.manifestPath,
          message: `${field}.${dependencyName} must use the workspace: protocol`,
        });
      }
    }
  }

  return violations;
}

export const APPROVED_WORKSPACE_PATTERNS = ['apps/*', 'packages/*', 'mcp/*'] as const;

export function validateWorkspacePatterns(patterns: readonly string[]): ArchitectureViolation[] {
  const expected = new Set(APPROVED_WORKSPACE_PATTERNS);
  const actual = new Set(patterns);
  const violations: ArchitectureViolation[] = [];

  for (const pattern of APPROVED_WORKSPACE_PATTERNS) {
    if (!actual.has(pattern)) {
      violations.push({
        code: 'REQUIRED_WORKSPACE_PATTERN_MISSING',
        path: 'pnpm-workspace.yaml',
        message: `required workspace pattern "${pattern}" is missing`,
      });
    }
  }

  for (const pattern of patterns) {
    if (!expected.has(pattern as (typeof APPROVED_WORKSPACE_PATTERNS)[number])) {
      violations.push({
        code: 'UNAPPROVED_WORKSPACE_PATTERN',
        path: 'pnpm-workspace.yaml',
        message: `workspace pattern "${pattern}" is not approved by ADR-0002`,
      });
    }
  }

  return violations;
}

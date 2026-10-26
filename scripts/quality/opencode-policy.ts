import { parseConfigFileTextToJson } from 'typescript';

export const GOVERNED_AGENT_IDS = ['architect', 'developer', 'researcher', 'team-leader'] as const;

export type GovernedAgentId = (typeof GOVERNED_AGENT_IDS)[number];

export const DISABLED_BUILTIN_AGENT_IDS = ['build', 'explore', 'general', 'plan'] as const;

export type AgentMode = 'primary' | 'subagent' | 'all';
export type PermissionEffect = 'allow' | 'deny' | 'ask';

export interface PermissionRule {
  action: string;
  resource: string;
  effect: PermissionEffect;
}

export interface OpenCodeAgentDefinition {
  id: string;
  description: string;
  mode: AgentMode;
  model?: string;
  permissions: PermissionRule[];
}

export interface OpenCodeProjectConfig {
  default_agent?: string;
  model?: unknown;
  permissions?: PermissionRule[];
  agents?: Record<string, { disabled?: boolean }>;
}

const EXPECTED_MODES: Record<GovernedAgentId, AgentMode> = {
  architect: 'primary',
  developer: 'subagent',
  researcher: 'subagent',
  'team-leader': 'all',
};

const EXPECTED_EDIT_EFFECTS: Record<GovernedAgentId, PermissionEffect> = {
  architect: 'deny',
  developer: 'allow',
  researcher: 'deny',
  'team-leader': 'deny',
};

const EXPECTED_DELEGATION: Record<GovernedAgentId, ReadonlySet<GovernedAgentId>> = {
  architect: new Set(['researcher', 'team-leader']),
  developer: new Set(),
  researcher: new Set(),
  'team-leader': new Set(['developer', 'researcher']),
};

const REQUIRED_GLOBAL_PERMISSIONS: readonly PermissionRule[] = [
  {
    action: 'external_directory',
    resource: '*',
    effect: 'deny',
  },
  {
    action: 'read',
    resource: '*.env',
    effect: 'deny',
  },
  {
    action: 'read',
    resource: '*.env.*',
    effect: 'deny',
  },
  {
    action: 'read',
    resource: '*.env.example',
    effect: 'allow',
  },
  {
    action: 'read',
    resource: '*.pem',
    effect: 'deny',
  },
  {
    action: 'read',
    resource: '*.key',
    effect: 'deny',
  },
  {
    action: 'read',
    resource: '*.p12',
    effect: 'deny',
  },
  {
    action: 'read',
    resource: '*.pfx',
    effect: 'deny',
  },
  {
    action: 'shell',
    resource: 'git push *',
    effect: 'deny',
  },
  {
    action: 'shell',
    resource: '*--no-verify*',
    effect: 'deny',
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unquoteYamlScalar(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseAgentMode(value: string, path: string): AgentMode {
  if (value === 'primary' || value === 'subagent' || value === 'all') {
    return value;
  }

  throw new Error(`invalid OpenCode agent mode in ${path}: ${value}`);
}

function parsePermissionEffect(value: string, path: string): PermissionEffect {
  if (value === 'allow' || value === 'deny' || value === 'ask') {
    return value;
  }

  throw new Error(`invalid OpenCode permission effect in ${path}: ${value}`);
}

function readFrontmatterField(frontmatter: string, field: string): string | undefined {
  const expression = new RegExp(`^${field}:\\s*(.+)$`, 'm');
  const match = expression.exec(frontmatter);

  return match?.[1] === undefined ? undefined : unquoteYamlScalar(match[1]);
}

export function parseOpenCodeConfig(
  source: string,
  path = 'opencode.jsonc',
): OpenCodeProjectConfig {
  const parsed = parseConfigFileTextToJson(path, source);

  if (parsed.error !== undefined) {
    throw new Error(`invalid OpenCode JSONC configuration: ${path}`);
  }

  if (!isRecord(parsed.config)) {
    throw new Error(`OpenCode configuration must be an object: ${path}`);
  }

  return parsed.config as OpenCodeProjectConfig;
}

export function parseOpenCodeAgent(
  id: string,
  source: string,
  path: string,
): OpenCodeAgentDefinition {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);

  if (match?.[1] === undefined) {
    throw new Error(`missing OpenCode agent frontmatter: ${path}`);
  }

  const frontmatter = match[1];
  const description = readFrontmatterField(frontmatter, 'description');
  const modeValue = readFrontmatterField(frontmatter, 'mode');
  const model = readFrontmatterField(frontmatter, 'model');

  if (description === undefined || description === '') {
    throw new Error(`missing OpenCode agent description: ${path}`);
  }

  if (modeValue === undefined) {
    throw new Error(`missing OpenCode agent mode: ${path}`);
  }

  const permissions: PermissionRule[] = [];
  const permissionPattern =
    /^\s*-\s+action:\s*(.+)\r?\n\s*resource:\s*(.+)\r?\n\s*effect:\s*(allow|deny|ask)\s*$/gm;

  for (const permissionMatch of frontmatter.matchAll(permissionPattern)) {
    const action = permissionMatch[1];
    const resource = permissionMatch[2];
    const effect = permissionMatch[3];

    if (action === undefined || resource === undefined || effect === undefined) {
      throw new Error(`invalid OpenCode permission rule: ${path}`);
    }

    permissions.push({
      action: unquoteYamlScalar(action),
      resource: unquoteYamlScalar(resource),
      effect: parsePermissionEffect(effect, path),
    });
  }

  const declaredPermissionCount = (frontmatter.match(/^\s*-\s+action:/gm) ?? []).length;

  if (permissions.length !== declaredPermissionCount) {
    throw new Error(`unrecognized OpenCode permission rule shape: ${path}`);
  }

  return {
    id,
    description,
    mode: parseAgentMode(modeValue, path),
    ...(model === undefined ? {} : { model }),
    permissions,
  };
}

export function findLastMatchingPermission(
  permissions: readonly PermissionRule[],
  action: string,
  resource: string,
): PermissionRule | undefined {
  return permissions.findLast(
    (permission) =>
      (permission.action === '*' || permission.action === action) &&
      (permission.resource === '*' || permission.resource === resource),
  );
}

function hasExactPermission(
  permissions: readonly PermissionRule[],
  expected: PermissionRule,
): boolean {
  return permissions.some(
    (permission) =>
      permission.action === expected.action &&
      permission.resource === expected.resource &&
      permission.effect === expected.effect,
  );
}

export function validateOpenCodePolicy(
  config: OpenCodeProjectConfig,
  agents: Readonly<Record<string, OpenCodeAgentDefinition>>,
): string[] {
  const violations: string[] = [];

  if (config.default_agent !== 'architect') {
    violations.push('default OpenCode agent must be architect');
  }

  if (config.model !== undefined) {
    violations.push('project-level model assignment is not yet authorized');
  }

  for (const builtinId of DISABLED_BUILTIN_AGENT_IDS) {
    if (config.agents?.[builtinId]?.disabled !== true) {
      violations.push(`built-in OpenCode agent must be disabled: ${builtinId}`);
    }
  }

  const globalPermissions = config.permissions ?? [];

  for (const requiredPermission of REQUIRED_GLOBAL_PERMISSIONS) {
    if (!hasExactPermission(globalPermissions, requiredPermission)) {
      violations.push(
        `missing global OpenCode permission: ${requiredPermission.action}|${requiredPermission.resource}|${requiredPermission.effect}`,
      );
    }
  }

  const actualAgentIds = Object.keys(agents).sort();
  const expectedAgentIds = [...GOVERNED_AGENT_IDS].sort();

  if (actualAgentIds.join('|') !== expectedAgentIds.join('|')) {
    violations.push(
      `visible governed OpenCode agents must be exactly: ${expectedAgentIds.join(', ')}`,
    );
  }

  for (const agentId of GOVERNED_AGENT_IDS) {
    const agent = agents[agentId];

    if (agent === undefined) {
      continue;
    }

    if (agent.mode !== EXPECTED_MODES[agentId]) {
      violations.push(`${agentId} mode must be ${EXPECTED_MODES[agentId]}`);
    }

    if (agent.model !== undefined) {
      violations.push(`${agentId} must not assign a model yet`);
    }

    const editPermission = findLastMatchingPermission(agent.permissions, 'edit', '*');

    if (editPermission?.effect !== EXPECTED_EDIT_EFFECTS[agentId]) {
      violations.push(`${agentId} edit permission must be ${EXPECTED_EDIT_EFFECTS[agentId]}`);
    }

    for (const targetAgentId of GOVERNED_AGENT_IDS) {
      const expectedEffect = EXPECTED_DELEGATION[agentId].has(targetAgentId) ? 'allow' : 'deny';

      const permission = findLastMatchingPermission(agent.permissions, 'subagent', targetAgentId);

      if (permission?.effect !== expectedEffect) {
        violations.push(`${agentId} delegation to ${targetAgentId} must be ${expectedEffect}`);
      }
    }
  }

  const researcher = agents.researcher;

  if (
    researcher !== undefined &&
    findLastMatchingPermission(researcher.permissions, 'shell', '*')?.effect !== 'deny'
  ) {
    violations.push('researcher shell permission must be deny');
  }

  return violations.sort((left, right) => left.localeCompare(right));
}

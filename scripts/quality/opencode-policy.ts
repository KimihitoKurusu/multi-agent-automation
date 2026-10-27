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

export interface OpenCodeCommandDefinition {
  description?: string;
  template?: string;
  agent?: string;
  model?: unknown;
  subagent?: boolean;
  subtask?: boolean;
}

export interface OpenCodeProjectConfig {
  default_agent?: string;
  model?: unknown;
  permissions?: PermissionRule[];
  agents?: Record<string, { disabled?: boolean }>;
  commands?: Record<string, OpenCodeCommandDefinition>;
}

export interface OpenCodeSkillDefinition {
  id: string;
  name: string;
  description: string;
  source: string;
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

export const OPERATIONAL_MEMORY_COMMAND_IDS = [
  'checkpoint',
  'close-session',
  'dev-written-handoff',
  'good-morning',
  'leader-written-handoff',
  'researcher-written-handoff',
] as const;

export const OPERATIONAL_MEMORY_SKILL_IDS = [
  'checkpoint',
  'close-session',
  'dev-written-handoff',
  'good-morning',
  'leader-written-handoff',
  'researcher-written-handoff',
] as const;

const EXPECTED_COMMAND_AGENTS: Record<
  (typeof OPERATIONAL_MEMORY_COMMAND_IDS)[number],
  GovernedAgentId | undefined
> = {
  checkpoint: undefined,
  'close-session': 'architect',
  'dev-written-handoff': 'developer',
  'good-morning': 'architect',
  'leader-written-handoff': 'team-leader',
  'researcher-written-handoff': 'researcher',
};

const EXPECTED_SKILL_ACCESS: Record<GovernedAgentId, ReadonlySet<string>> = {
  architect: new Set(['checkpoint', 'close-session', 'good-morning']),
  developer: new Set(['checkpoint', 'dev-written-handoff']),
  researcher: new Set(['checkpoint', 'researcher-written-handoff']),
  'team-leader': new Set(['checkpoint', 'leader-written-handoff']),
};

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

export function parseOpenCodeSkill(
  id: string,
  source: string,
  path: string,
): OpenCodeSkillDefinition {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);

  if (match?.[1] === undefined) {
    throw new Error(`missing OpenCode skill frontmatter: ${path}`);
  }

  const frontmatter = match[1];
  const name = readFrontmatterField(frontmatter, 'name');
  const description = readFrontmatterField(frontmatter, 'description');

  if (name === undefined || name === '') {
    throw new Error(`missing OpenCode skill name: ${path}`);
  }

  if (description === undefined || description === '') {
    throw new Error(`missing OpenCode skill description: ${path}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`invalid OpenCode skill name: ${path}`);
  }

  if (name !== id) {
    throw new Error(`OpenCode skill name must match directory: ${path}`);
  }

  return {
    id,
    name,
    description,
    source,
  };
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

function matchesPermissionPattern(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const expression = escaped.replaceAll('*', '.*').replaceAll('?', '.');

  return new RegExp(`^${expression}$`).test(value);
}

export function findLastMatchingPermission(
  permissions: readonly PermissionRule[],
  action: string,
  resource: string,
): PermissionRule | undefined {
  return permissions.findLast(
    (permission) =>
      matchesPermissionPattern(permission.action, action) &&
      matchesPermissionPattern(permission.resource, resource),
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

    for (const skillId of OPERATIONAL_MEMORY_SKILL_IDS) {
      const expectedEffect = EXPECTED_SKILL_ACCESS[agentId].has(skillId) ? 'allow' : 'deny';

      const skillPermission = findLastMatchingPermission(agent.permissions, 'skill', skillId);

      if (skillPermission?.effect !== expectedEffect) {
        violations.push(`${agentId} skill access to ${skillId} must be ${expectedEffect}`);
      }
    }

    if (agentId === 'architect' || agentId === 'team-leader' || agentId === 'researcher') {
      const memoryEdit = findLastMatchingPermission(
        agent.permissions,
        'edit',
        'docs/project-memory/example.md',
      );

      if (memoryEdit?.effect !== 'allow') {
        violations.push(`${agentId} operational-memory edit permission must be allow`);
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

  const configuredCommands = config.commands ?? {};
  const configuredCommandIds = Object.keys(configuredCommands).sort();
  const expectedCommandIds = [...OPERATIONAL_MEMORY_COMMAND_IDS].sort();

  if (configuredCommandIds.join('|') !== expectedCommandIds.join('|')) {
    violations.push(`OpenCode commands must be exactly: ${expectedCommandIds.join(', ')}`);
  }

  for (const commandId of OPERATIONAL_MEMORY_COMMAND_IDS) {
    const command = configuredCommands[commandId];

    if (command === undefined) {
      continue;
    }

    if (command.description === undefined || command.description.trim() === '') {
      violations.push(`${commandId} command must have a description`);
    }

    if (command.template === undefined || command.template.trim() === '') {
      violations.push(`${commandId} command must have a template`);
      continue;
    }

    if (!command.template.includes(`\`${commandId}\` skill`)) {
      violations.push(`${commandId} command must load its matching skill`);
    }

    if (command.template.includes('!`')) {
      violations.push(`${commandId} command must not contain embedded shell`);
    }

    if (command.model !== undefined) {
      violations.push(`${commandId} command must not override the model`);
    }

    if (command.subagent !== undefined) {
      violations.push(`${commandId} command must not configure subagent execution`);
    }

    if (command.subtask !== undefined) {
      violations.push(`${commandId} command must not use deprecated subtask`);
    }

    const expectedAgent = EXPECTED_COMMAND_AGENTS[commandId];

    if (command.agent !== expectedAgent) {
      violations.push(
        expectedAgent === undefined
          ? `${commandId} command must use the current agent`
          : `${commandId} command must use ${expectedAgent}`,
      );
    }
  }

  return violations.sort((left, right) => left.localeCompare(right));
}

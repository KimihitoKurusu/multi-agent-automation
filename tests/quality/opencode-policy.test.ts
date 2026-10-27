import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  findLastMatchingPermission,
  OPERATIONAL_MEMORY_COMMAND_IDS,
  OPERATIONAL_MEMORY_SKILL_IDS,
  parseOpenCodeAgent,
  parseOpenCodeConfig,
  parseOpenCodeSkill,
  validateOpenCodePolicy,
  type OpenCodeAgentDefinition,
  type OpenCodeProjectConfig,
  type OpenCodeSkillDefinition,
} from '../../scripts/quality/opencode-policy.js';

const repositoryRoot = process.cwd();
const agentsDirectory = join(repositoryRoot, '.opencode', 'agents');
const skillsDirectory = join(repositoryRoot, '.opencode', 'skills');

function readProjectConfig(): OpenCodeProjectConfig {
  return parseOpenCodeConfig(readFileSync(join(repositoryRoot, 'opencode.jsonc'), 'utf8'));
}

function readProjectAgents(): Record<string, OpenCodeAgentDefinition> {
  return Object.fromEntries(
    readdirSync(agentsDirectory)
      .filter((file) => file.endsWith('.md'))
      .map((file) => {
        const id = basename(file, '.md');
        const path = join(agentsDirectory, file);

        return [id, parseOpenCodeAgent(id, readFileSync(path, 'utf8'), path)];
      }),
  );
}

function readProjectSkills(): Record<string, OpenCodeSkillDefinition> {
  return Object.fromEntries(
    readdirSync(skillsDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const id = entry.name;
        const path = join(skillsDirectory, id, 'SKILL.md');

        return [id, parseOpenCodeSkill(id, readFileSync(path, 'utf8'), path)];
      }),
  );
}

function cloneConfig(config: OpenCodeProjectConfig): OpenCodeProjectConfig {
  return structuredClone(config);
}

function cloneAgents(
  agents: Record<string, OpenCodeAgentDefinition>,
): Record<string, OpenCodeAgentDefinition> {
  return structuredClone(agents);
}

describe('OpenCode project configuration parsing', () => {
  it('parses JSONC comments and trailing commas', () => {
    expect(
      parseOpenCodeConfig(`{
        // Project default
        "default_agent": "architect",
      }`),
    ).toEqual({
      default_agent: 'architect',
    });
  });

  it('rejects invalid JSONC', () => {
    expect(() => parseOpenCodeConfig('{ invalid')).toThrow(/invalid OpenCode JSONC configuration/);
  });
});

describe('OpenCode agent frontmatter parsing', () => {
  it('parses an agent definition', () => {
    expect(
      parseOpenCodeAgent(
        'example',
        `---
description: Example agent
mode: subagent
permissions:
  - action: edit
    resource: "*"
    effect: deny
---
Example instructions.
`,
        'example.md',
      ),
    ).toEqual({
      id: 'example',
      description: 'Example agent',
      mode: 'subagent',
      permissions: [
        {
          action: 'edit',
          resource: '*',
          effect: 'deny',
        },
      ],
    });
  });

  it('rejects missing frontmatter', () => {
    expect(() => parseOpenCodeAgent('example', 'No frontmatter', 'example.md')).toThrow(
      /missing OpenCode agent frontmatter/,
    );
  });

  it('rejects missing descriptions', () => {
    expect(() =>
      parseOpenCodeAgent(
        'example',
        `---
mode: subagent
---
Body
`,
        'example.md',
      ),
    ).toThrow(/missing OpenCode agent description/);
  });

  it('rejects missing modes', () => {
    expect(() =>
      parseOpenCodeAgent(
        'example',
        `---
description: Example
---
Body
`,
        'example.md',
      ),
    ).toThrow(/missing OpenCode agent mode/);
  });

  it('rejects unsupported modes', () => {
    expect(() =>
      parseOpenCodeAgent(
        'example',
        `---
description: Example
mode: unknown
---
Body
`,
        'example.md',
      ),
    ).toThrow(/invalid OpenCode agent mode/);
  });

  it('rejects malformed permission rules', () => {
    expect(() =>
      parseOpenCodeAgent(
        'example',
        `---
description: Example
mode: subagent
permissions:
  - action: edit
    effect: deny
---
Body
`,
        'example.md',
      ),
    ).toThrow(/unrecognized OpenCode permission rule shape/);
  });
});

describe('OpenCode skill frontmatter parsing', () => {
  it('parses a skill definition', () => {
    expect(
      parseOpenCodeSkill(
        'example-skill',
        `---
name: example-skill
description: Example reusable workflow.
---

# Example
`,
        'example-skill/SKILL.md',
      ),
    ).toMatchObject({
      id: 'example-skill',
      name: 'example-skill',
      description: 'Example reusable workflow.',
    });
  });

  it('rejects missing frontmatter', () => {
    expect(() => parseOpenCodeSkill('example', 'No frontmatter', 'example/SKILL.md')).toThrow(
      /missing OpenCode skill frontmatter/,
    );
  });

  it('rejects missing skill names', () => {
    expect(() =>
      parseOpenCodeSkill(
        'example',
        `---
description: Example
---
`,
        'example/SKILL.md',
      ),
    ).toThrow(/missing OpenCode skill name/);
  });

  it('rejects missing skill descriptions', () => {
    expect(() =>
      parseOpenCodeSkill(
        'example',
        `---
name: example
---
`,
        'example/SKILL.md',
      ),
    ).toThrow(/missing OpenCode skill description/);
  });

  it('rejects invalid skill names', () => {
    expect(() =>
      parseOpenCodeSkill(
        'Invalid_Skill',
        `---
name: Invalid_Skill
description: Example
---
`,
        'Invalid_Skill/SKILL.md',
      ),
    ).toThrow(/invalid OpenCode skill name/);
  });

  it('requires the declared name to match the directory', () => {
    expect(() =>
      parseOpenCodeSkill(
        'checkpoint',
        `---
name: close-session
description: Example
---
`,
        'checkpoint/SKILL.md',
      ),
    ).toThrow(/OpenCode skill name must match directory/);
  });
});

describe('OpenCode operational-memory skills', () => {
  const skills = readProjectSkills();

  it('contains exactly the governed operational-memory skills', () => {
    expect(Object.keys(skills).sort()).toEqual([...OPERATIONAL_MEMORY_SKILL_IDS].sort());
  });

  it.each(OPERATIONAL_MEMORY_SKILL_IDS)('loads the repository skill %s', (skillId) => {
    expect(skills[skillId]).toMatchObject({
      id: skillId,
      name: skillId,
    });

    expect(skills[skillId]?.description.trim()).not.toBe('');
  });
});

describe('OpenCode permission evaluation', () => {
  it('uses the last matching permission', () => {
    expect(
      findLastMatchingPermission(
        [
          {
            action: '*',
            resource: '*',
            effect: 'allow',
          },
          {
            action: 'edit',
            resource: '*',
            effect: 'deny',
          },
        ],
        'edit',
        'src/example.ts',
      ),
    ).toEqual({
      action: 'edit',
      resource: '*',
      effect: 'deny',
    });
  });

  it('returns undefined when no permission matches', () => {
    expect(
      findLastMatchingPermission(
        [
          {
            action: 'edit',
            resource: '*',
            effect: 'deny',
          },
        ],
        'shell',
        'git status',
      ),
    ).toBeUndefined();
  });

  it('lets a later narrow memory rule override a broad edit denial', () => {
    expect(
      findLastMatchingPermission(
        [
          {
            action: 'edit',
            resource: '*',
            effect: 'deny',
          },
          {
            action: 'edit',
            resource: 'docs/project-memory/*',
            effect: 'allow',
          },
        ],
        'edit',
        'docs/project-memory/sessions/session-1/checkpoint.md',
      ),
    ).toEqual({
      action: 'edit',
      resource: 'docs/project-memory/*',
      effect: 'allow',
    });
  });

  it('does not let the memory exception authorize unrelated edits', () => {
    expect(
      findLastMatchingPermission(
        [
          {
            action: 'edit',
            resource: '*',
            effect: 'deny',
          },
          {
            action: 'edit',
            resource: 'docs/project-memory/*',
            effect: 'allow',
          },
        ],
        'edit',
        'src/example.ts',
      ),
    ).toEqual({
      action: 'edit',
      resource: '*',
      effect: 'deny',
    });
  });
});

describe('OpenCode governed baseline', () => {
  const config = readProjectConfig();
  const agents = readProjectAgents();

  it('accepts the repository OpenCode baseline', () => {
    expect(validateOpenCodePolicy(config, agents)).toEqual([]);
  });

  it('requires Architect as the default agent', () => {
    const changed = cloneConfig(config);
    changed.default_agent = 'developer';

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'default OpenCode agent must be architect',
    );
  });

  it('requires Team Leader to remain read-oriented', () => {
    const changed = cloneAgents(agents);

    changed['team-leader']?.permissions.push({
      action: 'edit',
      resource: '*',
      effect: 'allow',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'team-leader edit permission must be deny',
    );
  });

  it('requires Researcher to remain read-only', () => {
    const changed = cloneAgents(agents);

    changed.researcher?.permissions.push({
      action: 'edit',
      resource: '*',
      effect: 'allow',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'researcher edit permission must be deny',
    );
  });

  it('requires visible built-in agents to remain disabled', () => {
    const changed = cloneConfig(config);

    if (changed.agents !== undefined) {
      changed.agents.build = {
        disabled: false,
      };
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'built-in OpenCode agent must be disabled: build',
    );
  });

  it('rejects project-level model assignment', () => {
    const changed = cloneConfig(config);
    changed.model = 'ollama/qwen3:8b';

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'project-level model assignment is not yet authorized',
    );
  });

  it('requires all global barriers', () => {
    const changed = cloneConfig(config);
    changed.permissions = changed.permissions?.filter(
      (permission) => permission.resource !== 'git push *',
    );

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'missing global OpenCode permission: shell|git push *|deny',
    );
  });

  it('rejects unexpected governed agents', () => {
    const changed = cloneAgents(agents);
    changed.unrestricted = {
      id: 'unrestricted',
      description: 'Unexpected agent',
      mode: 'primary',
      permissions: [],
    };

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'visible governed OpenCode agents must be exactly: architect, developer, researcher, team-leader',
    );
  });

  it('requires each governed mode', () => {
    const changed = cloneAgents(agents);

    if (changed.architect !== undefined) {
      changed.architect.mode = 'all';
    }

    expect(validateOpenCodePolicy(config, changed)).toContain('architect mode must be primary');
  });

  it('rejects agent-level model assignment', () => {
    const changed = cloneAgents(agents);

    if (changed.developer !== undefined) {
      changed.developer.model = 'ollama/qwen3:8b';
    }

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'developer must not assign a model yet',
    );
  });

  it('requires Architect to remain read-oriented', () => {
    const changed = cloneAgents(agents);

    changed.architect?.permissions.push({
      action: 'edit',
      resource: '*',
      effect: 'allow',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'architect edit permission must be deny',
    );
  });

  it('requires Developer edit authority', () => {
    const changed = cloneAgents(agents);

    changed.developer?.permissions.push({
      action: 'edit',
      resource: '*',
      effect: 'deny',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'developer edit permission must be allow',
    );
  });

  it('enforces the Architect delegation graph', () => {
    const changed = cloneAgents(agents);

    changed.architect?.permissions.push({
      action: 'subagent',
      resource: 'developer',
      effect: 'allow',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'architect delegation to developer must be deny',
    );
  });

  it('enforces the Team Leader delegation graph', () => {
    const changed = cloneAgents(agents);

    changed['team-leader']?.permissions.push({
      action: 'subagent',
      resource: 'developer',
      effect: 'deny',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'team-leader delegation to developer must be allow',
    );
  });

  it('keeps Researcher shell access denied', () => {
    const changed = cloneAgents(agents);

    changed.researcher?.permissions.push({
      action: 'shell',
      resource: '*',
      effect: 'allow',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'researcher shell permission must be deny',
    );
  });

  it('defines exactly the governed operational-memory commands', () => {
    expect(Object.keys(config.commands ?? {}).sort()).toEqual(
      [...OPERATIONAL_MEMORY_COMMAND_IDS].sort(),
    );
  });

  it('rejects a missing operational-memory command', () => {
    const changed = cloneConfig(config);

    if (changed.commands !== undefined) {
      delete changed.commands['good-morning'];
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'OpenCode commands must be exactly: checkpoint, close-session, dev-written-handoff, good-morning, leader-written-handoff, researcher-written-handoff',
    );
  });
  it('rejects an unexpected OpenCode command', () => {
    const changed = cloneConfig(config);

    changed.commands = {
      ...changed.commands,
      unrestricted: {
        description: 'Unexpected command',
        template: 'Unexpected command',
      },
    };

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'OpenCode commands must be exactly: checkpoint, close-session, dev-written-handoff, good-morning, leader-written-handoff, researcher-written-handoff',
    );
  });

  it('requires good-morning to run as Architect', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.['good-morning'] !== undefined) {
      changed.commands['good-morning'].agent = 'developer';
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'good-morning command must use architect',
    );
  });

  it('requires checkpoint to use the current agent', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.agent = 'architect';
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must use the current agent',
    );
  });

  it('requires command descriptions', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.description = '';
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must have a description',
    );
  });

  it('requires command templates', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.template = '';
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must have a template',
    );
  });

  it('requires each command to load its matching skill', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.template = 'Load and follow the `good-morning` skill.';
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must load its matching skill',
    );
  });

  it('rejects embedded shell in commands', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.template =
        'Load and follow the `checkpoint` skill.\n\n!`git status`';
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must not contain embedded shell',
    );
  });

  it('rejects command model overrides', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.model = 'ollama/qwen3:8b';
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must not override the model',
    );
  });

  it('rejects command subagent execution configuration', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.subagent = true;
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must not configure subagent execution',
    );
  });

  it('rejects deprecated command subtask configuration', () => {
    const changed = cloneConfig(config);

    if (changed.commands?.checkpoint !== undefined) {
      changed.commands.checkpoint.subtask = true;
    }

    expect(validateOpenCodePolicy(changed, agents)).toContain(
      'checkpoint command must not use deprecated subtask',
    );
  });

  it.each(['architect', 'team-leader', 'researcher'] as const)(
    'allows %s to edit operational memory',
    (agentId) => {
      const permission = findLastMatchingPermission(
        agents[agentId]?.permissions ?? [],
        'edit',
        'docs/project-memory/sessions/example/checkpoint.md',
      );

      expect(permission?.effect).toBe('allow');
    },
  );

  it.each(['architect', 'team-leader', 'researcher'] as const)(
    'keeps %s denied from unrelated edits',
    (agentId) => {
      const permission = findLastMatchingPermission(
        agents[agentId]?.permissions ?? [],
        'edit',
        'src/example.ts',
      );

      expect(permission?.effect).toBe('deny');
    },
  );

  it('prevents Architect from using the Developer handoff skill', () => {
    expect(
      findLastMatchingPermission(
        agents.architect?.permissions ?? [],
        'skill',
        'dev-written-handoff',
      )?.effect,
    ).toBe('deny');
  });

  it('prevents Developer from using close-session', () => {
    expect(
      findLastMatchingPermission(agents.developer?.permissions ?? [], 'skill', 'close-session')
        ?.effect,
    ).toBe('deny');
  });

  it('prevents Team Leader from using good-morning', () => {
    expect(
      findLastMatchingPermission(agents['team-leader']?.permissions ?? [], 'skill', 'good-morning')
        ?.effect,
    ).toBe('deny');
  });

  it('prevents Researcher from using the Leader handoff skill', () => {
    expect(
      findLastMatchingPermission(
        agents.researcher?.permissions ?? [],
        'skill',
        'leader-written-handoff',
      )?.effect,
    ).toBe('deny');
  });

  it('requires Architect operational-memory edit authority', () => {
    const changed = cloneAgents(agents);

    changed.architect!.permissions = changed.architect!.permissions.filter(
      (permission) =>
        !(permission.action === 'edit' && permission.resource === 'docs/project-memory/*'),
    );

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'architect operational-memory edit permission must be allow',
    );
  });

  it('requires the governed skill allowlist', () => {
    const changed = cloneAgents(agents);

    changed.developer?.permissions.push({
      action: 'skill',
      resource: 'close-session',
      effect: 'allow',
    });

    expect(validateOpenCodePolicy(config, changed)).toContain(
      'developer skill access to close-session must be deny',
    );
  });
});

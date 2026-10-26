import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  findLastMatchingPermission,
  parseOpenCodeAgent,
  parseOpenCodeConfig,
  validateOpenCodePolicy,
  type OpenCodeAgentDefinition,
  type OpenCodeProjectConfig,
} from '../../scripts/quality/opencode-policy.js';

const repositoryRoot = process.cwd();
const agentsDirectory = join(repositoryRoot, '.opencode', 'agents');

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
});

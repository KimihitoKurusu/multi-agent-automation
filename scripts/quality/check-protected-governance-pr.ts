import { execFileSync } from 'node:child_process';

import { evaluateProtectedGovernanceChange, parseGitNameStatus } from './protected-governance.js';

function git(...args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
  });
}

function requiredArgument(index: number, name: string): string {
  const value = process.argv[index];

  if (value === undefined || value.trim() === '') {
    throw new Error(`missing required argument: ${name}`);
  }

  return value.trim();
}

try {
  const sourceBranch = requiredArgument(2, 'source branch');
  const baseSha = requiredArgument(3, 'base SHA');
  const headSha = requiredArgument(4, 'head SHA');

  const changedOutput = git(
    'diff',
    '--name-status',
    '--diff-filter=ACDMR',
    '--find-renames',
    '-z',
    `${baseSha}...${headSha}`,
  );

  const changedPaths = parseGitNameStatus(changedOutput);
  const result = evaluateProtectedGovernanceChange(sourceBranch, changedPaths);

  if (result.protectedPaths.length === 0) {
    console.log(`No protected governance changes found in pull request from ${sourceBranch}.`);
    process.exit(0);
  }

  if (!result.allowed) {
    console.error(
      `Protected governance changes are not authorized from pull request branch "${sourceBranch}":`,
    );

    for (const path of result.protectedPaths) {
      console.error(`- ${path}`);
    }

    process.exit(1);
  }

  console.log(
    `Protected governance changes authorized from pull request branch "${sourceBranch}":`,
  );

  for (const path of result.protectedPaths) {
    console.log(`- ${path}`);
  }
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'unknown pull request governance validation error';

  console.error(`Cannot validate pull request governance: ${message}`);
  process.exit(1);
}

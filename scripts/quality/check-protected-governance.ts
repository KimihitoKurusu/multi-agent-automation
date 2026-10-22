import { execFileSync } from 'node:child_process';

import { evaluateProtectedGovernanceChange } from './protected-governance.js';

function git(...args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
  }).trim();
}

const branch = git('branch', '--show-current');

if (branch === '') {
  console.error('Cannot validate protected governance from a detached HEAD.');
  process.exitCode = 2;
} else {
  const stagedOutput = git('diff', '--cached', '--name-only', '--diff-filter=ACMR');

  const stagedPaths =
    stagedOutput === ''
      ? []
      : stagedOutput
          .split(/\r?\n/)
          .map((path) => path.trim())
          .filter((path) => path !== '');

  const decision = evaluateProtectedGovernanceChange(branch, stagedPaths);

  if (!decision.allowed) {
    console.error(decision.reason);

    for (const path of decision.protectedPaths) {
      console.error(`- ${path}`);
    }

    process.exitCode = 1;
  } else if (decision.protectedPaths.length > 0) {
    console.log(`Protected governance change authorized on ${branch}:`);

    for (const path of decision.protectedPaths) {
      console.log(`- ${path}`);
    }
  }
}

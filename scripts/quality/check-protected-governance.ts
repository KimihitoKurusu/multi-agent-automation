import { execFileSync } from 'node:child_process';

import { evaluateProtectedGovernanceChange, parseGitNameStatus } from './protected-governance.js';

function git(...args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
  });
}

const branch = git('branch', '--show-current').trim();

if (branch === '') {
  console.error('Cannot validate protected governance from a detached HEAD.');
  process.exitCode = 2;
} else {
  const stagedOutput = git(
    'diff',
    '--cached',
    '--name-status',
    '--diff-filter=ACDMR',
    '--find-renames',
    '-z',
  );

  const stagedPaths = parseGitNameStatus(stagedOutput);

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

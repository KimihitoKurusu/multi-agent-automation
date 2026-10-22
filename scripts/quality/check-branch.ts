import { classifyBranch } from './branch-policy.js';

const branch = process.argv[2];

if (branch === undefined) {
  console.error('Usage: check-branch <branch>');
  process.exitCode = 2;
} else {
  const result = classifyBranch(branch);

  if (!result.valid) {
    console.error(`Invalid governed branch "${branch}": ${result.reason}`);
    process.exitCode = 1;
  } else {
    console.log(`Valid ${result.kind} branch: ${branch}`);
  }
}

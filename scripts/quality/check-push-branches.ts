import { createInterface } from 'node:readline';

import { classifyBranch } from './branch-policy.js';

const input = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

let rejected = false;

for await (const line of input) {
  const trimmed = line.trim();

  if (trimmed === '') {
    continue;
  }

  const [localRef] = trimmed.split(/\s+/);

  if (localRef === undefined || !localRef.startsWith('refs/heads/')) {
    continue;
  }

  const branch = localRef.slice('refs/heads/'.length);
  const result = classifyBranch(branch);

  if (!result.valid) {
    console.error(`Invalid pushed branch "${branch}": ${result.reason}`);
    rejected = true;
    continue;
  }

  console.log(`Valid pushed ${result.kind} branch: ${branch}`);
}

if (rejected) {
  process.exitCode = 1;
}

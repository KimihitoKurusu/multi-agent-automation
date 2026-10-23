import { createInterface } from 'node:readline';

import {
  classifyBranch,
  parsePushRefUpdate,
  pushedBranchNames,
  PushRefUpdate,
} from './branch-policy.js';

const input = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

for await (const line of input) {
  const trimmed = line.trim();

  if (trimmed === '') {
    continue;
  }

  let update: PushRefUpdate;

  try {
    update = parsePushRefUpdate(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown pre-push parsing error';

    console.error(`Cannot validate pushed ref: ${message}`);
    process.exitCode = 1;
    continue;
  }

  const branchNames = pushedBranchNames(update);

  if (branchNames.length === 0) {
    console.log(`Skipping branch naming validation for ref deletion: ${update.remoteRef}`);
    continue;
  }

  for (const branchName of branchNames) {
    const classification = classifyBranch(branchName);

    if (!classification.valid) {
      console.error(`Invalid pushed branch "${branchName}": ${classification.reason}`);
      process.exitCode = 1;
      continue;
    }

    console.log(`Valid pushed ${classification.kind} branch: ${branchName}`);
  }
}

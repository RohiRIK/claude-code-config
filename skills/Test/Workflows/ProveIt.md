# ProveIt

Fix a bug by proving it exists with a failing test first.

## Step 1: Write a test that reproduces the bug

Write a test that triggers the exact bug. Run it — it must FAIL. A passing test at this stage means the test does not reproduce the bug; revise it until it fails for the right reason.

## Step 2: Confirm the failure is correct

Read the failure output. Confirm the test is failing because of the bug, not because of a setup error or unrelated issue.

## Step 3: Implement the fix

Write the minimum change needed to fix the bug. Avoid unrelated changes in the same commit.

## Step 4: Confirm the test passes

Run the test from Step 1. It must now pass.

## Step 5: Regression sweep

Run `bun test` across all files. Confirm no other tests broke as a result of the fix.

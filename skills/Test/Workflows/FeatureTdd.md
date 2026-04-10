# FeatureTdd

RED → GREEN → REFACTOR for a new feature or function.

## Step 1: RED — Write a failing test

Write tests that describe the expected behavior before writing any implementation. Run them and confirm they fail — this proves the tests are testing something real.

## Step 2: GREEN — Implement the minimum

Write the minimum code needed to make the tests pass. Resist adding more than what the tests require.

## Step 3: REFACTOR — Clean up

Improve the code while keeping tests green. Extract constants, rename for clarity, remove duplication.

## Step 4: Regression sweep

Run `bun test` across all files. Confirm no existing tests broke.

## Step 5: Coverage check

Verify coverage meets the threshold for this code type:
- General code: 80% minimum
- Auth, financial, security logic: 100%

# Conflict Resolution Reports

Conflict records should not be rewritten when a conflict is resolved.

Instead, HAIF appends a resolution report to:

```text
.haif/reports/conflict-resolutions.jsonl
```

This file is append-only by convention and tamper-evident by design. Each line includes a SHA-256 hash and the previous line's hash, forming a simple hash chain. If someone edits or deletes an earlier report, `haif validate` should fail.

## Resolve A Conflict

Create a conflict record:

```bash
haif new conflict "Onboarding API contract conflicts with profile refactor"
```

After human review, append a resolution report:

```bash
haif resolve-conflict conflict-onboarding-api-contract-conflicts-with-profile-refactor \
  --outcome=resolved \
  --summary="Profile refactor keeps the existing account-state contract until onboarding migration is complete." \
  --reviewer="staff-engineer"
```

Supported outcomes:

- `resolved`
- `merged`
- `rejected`
- `superseded`

## Why Append-Only

Conflict history matters. A resolved conflict is still useful context for future agents and humans:

- what overlapped
- who reviewed it
- what decision was made
- which assumption changed
- what work should not be repeated

Editing the original conflict record can erase that history. Appending a report preserves it.

## Validation

Run:

```bash
haif validate
```

Validation checks the conflict resolution hash chain. If a report has been manually edited, reordered, or partially deleted, validation reports a hash or previous-hash mismatch.

This is tamper-evident, not cryptographic access control. Use Git branch protection, CODEOWNERS, or review rules if your team needs stronger enforcement.

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

## Drift Conflicts

Conflicts are not only code conflicts. They can happen when an agent updates a design document, generated docs, Jira ticket, or implementation in a way that drifts from an approved decision.

In HAIF, approved `Decision` records are the source of truth. When an agent detects drift, it should first try to correct the draft, doc, ticket, or implementation back to the approved decision. If that is not safe or the decision itself may need to change, the agent should create a drift conflict.

Use:

```bash
haif drift-conflict \
  --app=accounts \
  --decision=decision-approve-account-status-api-design \
  --artifact=design-account-status-api \
  --summary="The updated design changes the response shape approved in the decision."
```

This creates a `Conflict` record under:

```text
.haif/records/conflicts/accounts/
```

The generated record includes a reviewer-focused `tldr` and links the artifact back to the approved decision.

It also pre-fills the conflict body with:

- the approved decision id
- the drifted artifact id
- the observed drift summary
- the expected agent action
- the human review questions

HAIF creates the file and context automatically when the agent or human runs `haif drift-conflict`. To make this automatic in daily work, keep the HAIF workflow section in `AGENTS.md`, `CLAUDE.md`, Cursor rules, or any other repo instruction file your agents read.

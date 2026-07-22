# HAIF Agent Instructions

This repository uses HAIF: the Human-Agent Intent Framework.

Agents must preserve shared human intent before turning ideas into tickets, docs, decisions, or execution.

## Required Preflight

Before significant planning, Jira ticket creation, documentation, code generation, or implementation:

1. Read relevant HAIF records in `.haif/records`.
2. Run HAIF preflight when the CLI is available:

   ```bash
   npm run haif -- preflight
   ```

   Or with Python:

   ```bash
   PYTHONPATH=packages/python/src python -m haif.cli preflight
   ```

3. If preflight reports missing approved decision or unresolved conflict, stop and ask for human review.

## Record Placement

When creating HAIF records, use the stage folder first and the application, service, or workstream subfolder second.

Examples:

```bash
haif new proposal "Add account status API" --app=accounts
haif new design "Account status API design" --app=accounts
haif new decision "Approve account status API design" --app=accounts
```

Expected locations:

```text
.haif/records/proposals/accounts/
.haif/records/designs/accounts/
.haif/records/decisions/accounts/
```

Do not create one large intent/design file for the whole project.

## Agent Boundaries

Agents may:

- create `Proposal` records
- summarize context
- compare options
- draft implementation plans
- create `AgentRun` records
- implement from approved HAIF context

Agents must not:

- treat a `Proposal` as committed work
- approve their own output
- create committed Jira tickets or implementation work without an approved HAIF decision
- mark a design, decision, or release as approved
- continue implementation when unresolved conflicts exist
- silently expand scope across shared systems
- edit conflict resolution reports manually

## Required Links

For significant work, link output back to HAIF records:

- every HAIF record includes a reviewer-focused `tldr`
- plans link to `Proposal`, `Design`, or `Decision`
- implementation links to an approved `Decision`
- PRs link to the approved `Decision`
- generated docs link to source records
- agent work summaries are captured as `AgentRun`

## Drift Rule

If implementation changes architecture, APIs, data models, security behavior, ownership, or scope, create or request a design review before continuing.

## Conflict Resolution Rule

When a conflict is resolved, do not rewrite the original conflict record. Use `haif resolve-conflict` so HAIF appends a hash-chained resolution report under `.haif/reports/conflict-resolutions.jsonl`.

Decision conflicts should be captured as `Conflict` records under the relevant application/workstream:

```bash
haif new conflict "Decision A conflicts with Decision B" --app=accounts --related=decision-a,decision-b
```

## Default Record Flow

```text
Proposal -> Design -> Decision -> actual implementation
```

When unsure, stop at `Proposal` and ask a human to promote or reject the work.

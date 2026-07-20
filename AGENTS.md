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

3. If preflight reports missing intent, missing approved decision, or unresolved conflict, stop and ask for human review.

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
- create committed Jira tickets without accepted HAIF intent
- mark a design, decision, or release as approved
- continue implementation when unresolved conflicts exist
- silently expand scope across shared systems

## Required Links

For significant work, link output back to HAIF records:

- plans link to `Intent`
- implementation links to `Decision` or reviewed `Design`
- PRs link to `Task` and `Intent`
- generated docs link to source records
- agent work summaries are captured as `AgentRun`

## Drift Rule

If implementation changes architecture, APIs, data models, security behavior, ownership, or scope, create or request a design review before continuing.

## Default Record Flow

```text
Signal -> Proposal -> Intent -> Design -> Decision -> Task -> Implementation -> Review -> Release
```

When unsure, stop at `Proposal` and ask a human to promote or reject the work.

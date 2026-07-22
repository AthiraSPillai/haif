# Using AGENTS.md With HAIF

`AGENTS.md` gives coding agents and AI assistants repo-local operating instructions.

Use it to make HAIF enforceable in day-to-day work. The file tells agents what they may do, what requires human review, and when to stop instead of generating more tickets, docs, or code.

## How AGENTS.md Aligns With HAIF

HAIF has three complementary pieces:

- `AGENTS.md`: tells agents how to behave in a specific repo.
- `.haif/records`: stores proposals, designs, decisions, conflicts, and agent runs.
- `haif preflight`: checks whether work is ready for agent-assisted execution.

In this model, `AGENTS.md` is the instruction layer, HAIF records are the coordination layer, and preflight is the enforcement check.

## Recommended Setup

Copy the root `AGENTS.md` into any repo or workspace where the team wants to use HAIF.

You can also run `haif init`. It creates `AGENTS.md` if missing, or appends a marked HAIF workflow section if `AGENTS.md` already exists.

```text
your-repo/
  AGENTS.md
  .haif/
    records/
      proposals/
      designs/
      decisions/
      conflicts/
```

## What It Does

The HAIF `AGENTS.md` instructs agents to:

- write or preserve the `tldr` field so human reviewers can focus quickly
- read `.haif/records` before significant work
- run `haif preflight` when available
- classify new agent-created docs as `Proposal`, `Design`, or `Decision`
- place new HAIF docs under the matching stage folder and app/workstream subfolder
- distinguish proposal from committed work
- stop when an approved decision, owner, or conflict resolution is missing
- link plans, PRs, docs, and implementation back to HAIF records
- treat approved `Decision` records as the source of truth
- create a `Conflict` with a TLDR when docs, tickets, designs, or implementation drift from a decision and cannot be corrected safely

## Team Rule To Add

Use this as the first rule in repos using agents:

> Agents can propose work, summarize context, and draft designs, but committed tickets, docs, and implementation should link to a human-approved HAIF decision.

## Agent-Created Docs

When an agent creates or updates a document, it should first decide what kind of HAIF record it is:

- `Proposal`: the work is suggested, exploratory, or not yet accepted.
- `Design`: the approach is being drafted or revised.
- `Decision`: a human-approved direction is being recorded.

The agent should then place the record under the matching folder:

```text
.haif/records/proposals/<app>/
.haif/records/designs/<app>/
.haif/records/decisions/<app>/
```

Before and after updating a doc, the agent should compare it with related approved `Decision` records. If the doc drifts, the agent should correct the doc back to the decision when possible. If the correction is unclear or would change scope, the agent should create a conflict:

```bash
haif drift-conflict --app=accounts --decision=decision-id --artifact=doc-or-change-id --summary="Short reviewer-focused drift summary."
```

The approved decision remains the source of truth until humans approve a new decision.

## Codex And Claude

Codex, Claude Code, Cursor, Copilot-style agents, and similar tools can all consume this file as repo-local guidance. If a tool supports custom instructions, paste the same rules there too.

The goal is not to make agents slower. The goal is to make sure they produce work from shared human-reviewed context.

## How Skills Align With HAIF

Agent skills are reusable workflows. HAIF records are the shared coordination state those workflows should read and update.

For example, a Jira ticket-creation skill should:

- check HAIF records before creating tickets
- create a `Proposal` if the work is only suggested
- require an approved `Decision` before creating committed execution tickets
- record the agent activity as an `AgentRun`
- stop if there is an unresolved `Conflict`

A code implementation skill should:

- run HAIF preflight before planning or editing
- link its plan to a `Proposal`, `Design`, or approved `Decision`
- link implementation to an approved `Decision`
- correct implementation back to the approved `Decision` when drift is found
- create a drift conflict if the correction is unclear or may require a new decision

This keeps skills from becoming isolated automation. They become HAIF-aware workflows that preserve shared human review and alignment.

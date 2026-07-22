# Using AGENTS.md With HAIF

`AGENTS.md` gives coding agents and AI assistants repo-local operating instructions.

Use it to make HAIF enforceable in day-to-day work. The file tells agents what they may do, what requires human review, and when to stop instead of generating more tickets, docs, or code.

## How AGENTS.md Aligns With HAIF

HAIF has three complementary pieces:

- `AGENTS.md`: tells agents how to behave in a specific repo.
- `.haif/records`: stores shared intent, proposals, decisions, conflicts, and agent runs.
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
      intents/
      decisions/
```

## What It Does

The HAIF `AGENTS.md` instructs agents to:

- write or preserve the `tldr` field so human reviewers can focus quickly
- read `.haif/records` before significant work
- run `haif preflight` when available
- distinguish proposal from committed work
- stop when intent, owner, approval, or conflict resolution is missing
- link plans, PRs, docs, and implementation back to HAIF records
- request design review when implementation drifts

## Team Rule To Add

Use this as the first rule in repos using agents:

> Agents can propose work, summarize context, and draft implementation plans, but committed tickets and design direction should link to a human-reviewed HAIF intent.

## Codex And Claude

Codex, Claude Code, Cursor, Copilot-style agents, and similar tools can all consume this file as repo-local guidance. If a tool supports custom instructions, paste the same rules there too.

The goal is not to make agents slower. The goal is to make sure they produce work from shared human-reviewed context.

## How Skills Align With HAIF

Agent skills are reusable workflows. HAIF records are the shared coordination state those workflows should read and update.

For example, a Jira ticket-creation skill should:

- check HAIF records before creating tickets
- create a `Proposal` if the work is only suggested
- require an accepted `Intent` before creating committed execution tickets
- record the agent activity as an `AgentRun`
- stop if there is an unresolved `Conflict`

A code implementation skill should:

- run HAIF preflight before planning or editing
- link its plan to an accepted `Intent`
- link implementation to an approved `Decision` or reviewed `Design`
- create a review note if implementation drifts from design

This keeps skills from becoming isolated automation. They become HAIF-aware workflows that preserve shared human review and alignment.

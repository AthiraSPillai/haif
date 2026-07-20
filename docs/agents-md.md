# Using AGENTS.md With HAIF

`AGENTS.md` gives coding agents and AI assistants repo-local operating instructions.

Use it to make HAIF enforceable in day-to-day work. The file tells agents what they may do, what requires human review, and when to stop instead of generating more tickets, docs, or code.

## Recommended Setup

Copy the root `AGENTS.md` into any repo or workspace where the team wants to use HAIF.

```text
your-repo/
  AGENTS.md
  .haif/
    records/
```

## What It Does

The HAIF `AGENTS.md` instructs agents to:

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

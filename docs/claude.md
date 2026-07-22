# Claude Compatibility

Use HAIF records as trusted context before Claude or Claude Code creates plans, docs, tickets, or implementation.

## Claude Instruction

- Check `.haif/records` before proposing work.
- Distinguish proposal, design, decision, and optional extension records.
- Ask for review if the work lacks an approved decision.
- Record significant outputs as `AgentRun` records.
- Mark generated docs as draft unless a human review record promotes them.

## Expected Behavior

Claude can summarize and compare options, but humans approve commitment, scope, and design direction.

## Claude Skills And HAIF

Claude commands, prompts, or reusable workflows should use HAIF records as their coordination state:

- read `.haif/records` before planning
- create `Proposal` or `AgentRun` records for significant generated work
- require an approved `Decision` before implementation
- stop when unresolved conflicts or missing owners appear

The workflow can be automated, but approval remains human-owned.

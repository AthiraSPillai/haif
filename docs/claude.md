# Claude Compatibility

Use HAIF records as trusted context before Claude or Claude Code creates plans, docs, tickets, or implementation.

## Claude Instruction

- Check `.haif/records` before proposing work.
- Distinguish proposal, intent, design, decision, and task.
- Ask for review if the work lacks accepted intent or approved design.
- Record significant outputs as `AgentRun` records.
- Mark generated docs as draft unless a human review record promotes them.

## Expected Behavior

Claude can summarize and compare options, but humans approve commitment, scope, and design direction.

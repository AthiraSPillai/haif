# Codex Compatibility

Use HAIF as a preflight layer before Codex plans or edits.

## Codex Instruction

Before significant planning, ticket creation, documentation, or code changes:

1. Run `haif preflight`.
2. Read relevant HAIF records from `.haif/records`.
3. Stop and request human review if owner, accepted intent, approved design, or conflict resolution is missing.
4. Create an `AgentRun` record for significant generated work.
5. Cite HAIF records used as source context.

## Codex Must Not

- Treat a proposal as committed work.
- Approve its own output.
- Create official Jira tickets without accepted intent.
- Continue implementation when unresolved conflicts exist.

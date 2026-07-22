# Codex Compatibility

Use HAIF as a preflight layer before Codex plans or edits.

## Codex Instruction

Before significant planning, ticket creation, documentation, or code changes:

1. Run `haif preflight`.
2. Read relevant HAIF records from `.haif/records`.
3. Stop and request human review if owner, approved decision, or conflict resolution is missing.
4. Create an `AgentRun` record for significant generated work.
5. Cite HAIF records used as source context.

## Codex Skills And HAIF

If Codex uses a skill or reusable workflow, the skill should still follow HAIF:

- read `AGENTS.md` for repo-local rules
- use `.haif/records` as shared context
- create or update HAIF records when proposing or changing work
- stop when human review is required

Skills should automate the workflow around HAIF, not bypass it.

## Codex Must Not

- Treat a proposal as committed work.
- Approve its own output.
- Create official Jira tickets or implementation work without an approved HAIF decision.
- Continue implementation when unresolved conflicts exist.

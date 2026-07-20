# Codex Preflight Example

Before Codex plans or edits, run:

```bash
haif preflight --scope jira,agents
haif export-context --scope jira,agents
```

Codex should stop if HAIF reports missing intent, unresolved conflicts, or unapproved design.

# GitHub Workflow

GitHub owns code and review. HAIF owns shared intent.

## PR Expectations

Every meaningful PR should link to:

- an approved `Decision`
- the related `Design` when design context matters
- the related Jira ticket when execution is tracked in Jira

## Suggested PR Checklist

```markdown
- [ ] Linked approved HAIF decision
- [ ] Linked design where needed
- [ ] No unresolved HAIF conflict
- [ ] Scope drift reviewed
- [ ] AgentRun record created for significant AI-generated work
```

## CI

Use `haif-check` to run validation on every PR.

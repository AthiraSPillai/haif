# GitHub Workflow

GitHub owns code and review. HAIF owns shared intent.

## PR Expectations

Every meaningful PR should link to:

- an accepted `Intent`
- an approved `Decision` or reviewed `Design`
- a `Task` record or Jira ticket

## Suggested PR Checklist

```markdown
- [ ] Linked HAIF intent
- [ ] Linked design or decision where needed
- [ ] No unresolved HAIF conflict
- [ ] Scope drift reviewed
- [ ] AgentRun record created for significant AI-generated work
```

## CI

Use `haif-check` to run validation on every PR.

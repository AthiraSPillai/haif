# HAIF Lifecycle

HAIF separates possibility from commitment.

```text
Proposal -> Design -> Decision -> actual implementation
```

## V1 Core Records

- `Proposal`: suggested work that is not yet accepted.
- `Design`: proposed approach, options, tradeoffs, and risks.
- `Decision`: approved, rejected, or superseded direction.

Actual implementation is not a HAIF record in v1. Code, PRs, Jira tickets, docs, tests, and releases stay in the tools teams already use.

## Optional Extension Records

Teams can add these later if they need more traceability:

- `Conflict`: overlapping or contradictory proposals, designs, or decisions.
- `AgentRun`: significant agent-generated plan, code, docs, or ticket output.
- `Task`: execution work derived from an approved decision.
- `Review`: human review checkpoint.
- `Signal`: raw observation, risk, issue, or opportunity.

## Rule

AI agents can create proposals and draft designs. Humans approve decisions before implementation.

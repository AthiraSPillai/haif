# TLDR For Human Review

Every HAIF record should include a `tldr` field.

The TLDR exists to help human reviewers focus quickly before reading the full record. It should summarize:

- what changed or is being proposed
- why it matters
- what decision, review, or attention is needed

## Recommended Style

Keep the TLDR to one or two sentences.

Good:

```yaml
tldr: This proposal suggests routing agent-created Jira tickets through HAIF intent review before they enter the committed backlog. Review is needed to confirm ownership, scope, and whether this should become official work.
```

Less useful:

```yaml
tldr: This is about Jira tickets.
```

## Agent Guidance

Agents should write or preserve the `tldr` field when creating or updating HAIF records.

Agents should not use the TLDR as a replacement for the full record. The TLDR is a review aid, not the source of truth.

## Human Review Flow

Reviewers can use TLDRs to triage:

- records that are ready for approval
- records that need ownership
- proposals that should be merged or rejected
- implementation work that may have drifted from design
- conflicts that need a human decision

The full record should still be read before approving intent, design, decisions, or release readiness.

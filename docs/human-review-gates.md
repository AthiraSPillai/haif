# Human Review Gates

HAIF makes human review explicit at state transitions.

Every record should include a `tldr` field so reviewers can quickly understand what changed, why it matters, and what decision is needed before reading the full record.

## Required Gates

- `Proposal -> Design`: confirms the work is worth designing.
- `Design -> Decision`: confirms architecture, tradeoffs, risk, and review.
- `Decision -> implementation`: confirms execution should begin in Jira, GitHub, docs, or other existing tools.
- Major scope or design drift: returns work to design review.

## Review Levels

- `fast_path`: small, low-risk changes with one owner approval.
- `standard`: feature or workflow changes with owner plus technical reviewer.
- `architecture`: cross-system, data, security, platform, or customer-facing changes.

## Agent Rule

Agents may not approve their own proposals, designs, decisions, or release readiness.

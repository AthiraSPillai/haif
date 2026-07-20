# Human Review Gates

HAIF makes human review explicit at state transitions.

## Required Gates

- `Proposal -> Intent`: confirms real work, owner, and priority.
- `Intent -> Design`: confirms scope and affected systems.
- `Design -> Decision`: confirms architecture, tradeoffs, risk, and review.
- `Decision -> Task`: confirms execution work matches approved direction.
- `Implementation -> Review`: confirms delivered work matches intent and decision.
- Major scope or design drift: returns work to design review.

## Review Levels

- `fast_path`: small, low-risk changes with one owner approval.
- `standard`: feature or workflow changes with owner plus technical reviewer.
- `architecture`: cross-system, data, security, platform, or customer-facing changes.

## Agent Rule

Agents may not approve their own proposals, designs, decisions, or release readiness.

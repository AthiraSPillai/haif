# HAIF: Human-Agent Intent Framework

**Shared intent before agent execution.**

HAIF, the proposed Human-Agent Intent Framework, is a shared coordination layer that helps teams preserve human-owned intent, review, and alignment before AI agents turn ideas into tickets, docs, decisions, or execution.

AI agents make individual work faster. They also make it easier for teams to create duplicate tickets, conflicting plans, stale docs, and implementation drift from partial context. HAIF gives humans and agents a simple lifecycle, record format, and preflight workflow so proposals become committed work only after ownership and review are clear.

## Why HAIF Exists

Current tools each own part of the work:

- Jira owns tasks.
- GitHub owns code.
- Slack and Teams own conversation.
- Confluence and docs own knowledge.
- AI agents own generation.

None of them reliably owns shared human-agent intent.

HAIF adds that missing layer:

```text
Signal -> Proposal -> Intent -> Design -> Decision -> Task -> Implementation -> Review -> Release
```

Agents can observe, summarize, propose, compare, draft, and implement from approved context. Humans own commitment, scope, ownership, design approval, cross-workstream alignment, and release readiness.

## Quick Start

```bash
npm install
npm run build
node packages/cli/dist/index.js init
node packages/cli/dist/index.js new proposal "Reduce duplicate agent-created Jira tickets"
node packages/cli/dist/index.js validate
node packages/cli/dist/index.js preflight --scope jira,docs
```

For local development without publishing the CLI package:

```bash
npm run haif -- validate
```

## Repo Contents

- `docs/`: framework docs, lifecycle, review gates, Jira/Codex/Claude/GitHub guidance, and adoption playbook.
- `schema/`: JSON schemas for HAIF records and lifecycle configuration.
- `templates/`: Markdown templates for core HAIF record types.
- `examples/`: small-team, Jira-first, and Codex preflight examples.
- `packages/cli/`: Node CLI for validation, record creation, preflight, overlap detection, review status, and context export.
- `packages/python/`: Python SDK and CLI for AI engineering, data, and enterprise automation workflows.
- `assets/`: diagrams for articles, docs, and presentations.

## Core Record Types

- `Signal`: raw observation or issue.
- `Proposal`: suggested work, not yet accepted.
- `Intent`: accepted problem or opportunity with owner and scope.
- `Design`: proposed technical or operational direction.
- `Decision`: approved, rejected, or superseded direction.
- `Task`: execution work, often mapped to Jira.
- `Review`: human review checkpoint.
- `Conflict`: duplicate, overlapping, or contradictory work.
- `AgentRun`: agent-generated plan, ticket, doc, or code summary.

## CLI Commands

```bash
haif init
haif validate
haif new proposal "Title"
haif new intent "Title"
haif preflight
haif detect-overlap
haif review-status
haif export-context
```

## Python Support

HAIF also ships a dependency-free Python implementation:

```bash
set PYTHONPATH=packages/python/src
python -m haif.cli init
python -m haif.cli validate
python -m haif.cli preflight --scope jira,docs
```

See [docs/python.md](docs/python.md).

## Human Review Rules

HAIF expects human approval at important transitions:

- `Proposal -> Intent`
- `Intent -> Design`
- `Design -> Decision`
- `Decision -> Task`
- `Implementation -> Review`
- Major scope or design drift

Agents may not approve their own proposals, designs, decisions, or release readiness.

## License

Apache-2.0. See [LICENSE](LICENSE).

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

## If You Already Use AI Agents And Repo Instructions

HAIF does not replace your existing agent instructions. It adds shared coordination state for Codex, Claude, Cursor, Copilot-style agents, and other AI agents to read before they act.

```text
your-repo/
  AGENTS.md          <- tells agents how to behave
  .haif/records/    <- tells agents what the team has agreed on
```

Add a HAIF section to your existing repo instruction file, such as `AGENTS.md`, `CLAUDE.md`, or another tool-specific instruction file:

```markdown
## HAIF Workflow

This repo uses HAIF: Human-Agent Intent Framework.

Before significant planning, ticket creation, docs, or code changes:

1. Read `.haif/records`.
2. Run `haif preflight` if available.
3. Continue only if there is accepted intent and no unresolved conflict.
4. If intent is missing, create a HAIF `Proposal` instead of starting implementation.
5. If implementation changes scope, APIs, data models, security, or architecture, stop and request human review.

Agents may propose work, but humans approve intent, design, decisions, and release readiness.
```

The day-to-day flow is:

```text
Human or agent sees work
        |
        v
Agent reads AGENTS.md
        |
        v
Agent checks .haif/records
        |
        v
Agent runs haif preflight
        |
        +--> aligned: plan, code, document, or create tickets
        |
        +--> not aligned: create Proposal and ask for human review
```

In short: keep `AGENTS.md`, add HAIF rules to it, create `.haif/records`, and ask agents to check HAIF before meaningful work.

`haif init` creates or updates `AGENTS.md` automatically. If an `AGENTS.md` file already exists, HAIF appends a marked HAIF workflow section instead of replacing your current instructions.

## Quick Start: Try HAIF By Cloning This Repo

Works on macOS, Linux, and Windows with Node 20+.

```bash
git clone https://github.com/AthiraSPillai/haif.git
cd haif
npm install
npm run build
npm link
```

After `npm link`, the `haif` command should work from any repo:

```bash
haif --help
```

Initialize HAIF records in the cloned repo:

```bash
haif init
haif new proposal "Reduce duplicate agent-created Jira tickets"
haif validate
haif preflight --scope jira,docs
```

For local development without publishing the CLI package:

```bash
npm run haif -- validate
```

If global linking is unavailable or blocked by local permissions, use the built CLI path instead:

```bash
node packages/cli/dist/index.js validate
```

## Use HAIF In Your Existing Project

Use this when you already have a project with Codex, Claude, Cursor, Copilot-style agents, or repo instruction files.

1. Clone HAIF somewhere on your machine:

   ```bash
   git clone https://github.com/AthiraSPillai/haif.git
   cd haif
   npm install
   npm run build
   npm link
   ```

   If `npm link` fails on macOS or Linux because of npm permissions, use a Node version manager or skip global linking and use the fallback path shown below.

2. Go to your own project:

   ```bash
   cd path/to/your-project
   ```

3. Initialize HAIF records in your project:

   ```bash
   haif init
   ```

4. Add a proposal before significant agent-assisted work:

   ```bash
   haif new proposal "Refactor onboarding flow"
   ```

5. Validate records:

   ```bash
   haif validate
   ```

6. Run preflight before agents create tickets, docs, designs, or code:

   ```bash
   haif preflight --scope onboarding
   ```

7. Add HAIF guidance to your existing repo instruction file, such as `AGENTS.md` or `CLAUDE.md`.

   Use the example in [docs/agents-md.md](docs/agents-md.md).

### Fallback: Use HAIF Without Global Install

If `haif` is not available globally, point directly to the cloned HAIF CLI.

macOS/Linux:

```bash
node /path/to/haif/packages/cli/dist/index.js preflight --scope onboarding
```

Windows PowerShell:

```powershell
node "C:\path\to\haif\packages\cli\dist\index.js" preflight --scope onboarding
```

Use this fallback in `AGENTS.md` or `CLAUDE.md` if your team does not want a global CLI.

```markdown
Run HAIF preflight with:

node /path/to/haif/packages/cli/dist/index.js preflight --scope onboarding
```

## Use HAIF With Python

1. Clone HAIF:

   ```bash
   git clone https://github.com/AthiraSPillai/haif.git
   cd haif
   ```

2. Run the Python CLI from the HAIF repo:

   Windows PowerShell:

   ```powershell
   $env:PYTHONPATH="packages/python/src"
   python -m haif.cli init
   python -m haif.cli new proposal "Reduce duplicate agent-created tickets"
   python -m haif.cli validate
   python -m haif.cli preflight --scope jira,docs
   ```

   On macOS or Linux:

   ```bash
   PYTHONPATH=packages/python/src python -m haif.cli init
   PYTHONPATH=packages/python/src python -m haif.cli new proposal "Reduce duplicate agent-created tickets"
   PYTHONPATH=packages/python/src python -m haif.cli validate
   PYTHONPATH=packages/python/src python -m haif.cli preflight --scope jira,docs
   ```

## Team Pilot Workflow

Start with one project or workstream. Use HAIF as a lightweight pre-work alignment check before agents create Jira tickets, docs, designs, or code.

```text
Idea or agent suggestion
        |
        v
HAIF Proposal
        |
        v human review
HAIF Intent
        |
        v
Jira ticket / design / implementation
        |
        v
PR or final output links back to HAIF Intent
```

Recommended first team rule:

> Agents can propose work, summarize context, and draft implementation plans, but committed Jira tickets and design direction should link to a human-reviewed HAIF intent.

For a small pilot, start with only three record types:

- `Proposal`: possible work from a human or agent.
- `Intent`: accepted work with owner, scope, affected systems, and related context.
- `Decision`: reviewed direction that agents and humans can treat as current.

Add the rest of the lifecycle after the team has used this for a few real tasks.

## Record Folders

HAIF keeps records in stage-specific folders so teams do not end up with one large intent file or one crowded records directory.

```text
.haif/
  records/
    signals/
    proposals/
    intents/
    designs/
    decisions/
    tasks/
    reviews/
    conflicts/
    agent-runs/
```

`haif new proposal "Title"` creates a file under `.haif/records/proposals/`.

`haif new intent "Title"` creates a file under `.haif/records/intents/`.

Validation, preflight, overlap detection, review status, and context export read records recursively, so older flat `.haif/records/*.md` files still work.

## Conflict Resolution Reports

Conflict records are historical records. When a conflict is resolved, HAIF appends a tamper-evident report instead of rewriting the conflict record.

```bash
haif resolve-conflict conflict-example \
  --outcome=resolved \
  --summary="Human-reviewed resolution summary." \
  --reviewer="reviewer-name"
```

Resolution reports are stored in:

```text
.haif/reports/conflict-resolutions.jsonl
```

Each report is hash-chained to the previous report. `haif validate` checks the chain and reports manual edits, reordered lines, or deleted history. See [docs/conflict-resolution.md](docs/conflict-resolution.md).

## Repo Contents

- `docs/`: framework docs, lifecycle, review gates, Jira/Codex/Claude/GitHub guidance, and adoption playbook.
- `schema/`: JSON schemas for HAIF records and lifecycle configuration.
- `templates/`: Markdown templates for core HAIF record types.
- `examples/`: small-team, Jira-first, and Codex preflight examples.
- `packages/cli/`: Node CLI for validation, record creation, preflight, overlap detection, review status, and context export.
- `packages/python/`: Python SDK and CLI for AI engineering, data, and enterprise automation workflows.
- `assets/`: diagrams for articles, docs, and presentations.
- `AGENTS.md`: repo-local instructions for Codex, Claude, and similar agents.

## Core Record Types

Every HAIF record should include a `tldr` field: one or two sentences that tell a human reviewer what changed, why it matters, and what decision or attention is needed.

See [docs/tldr.md](docs/tldr.md) for TLDR guidance.

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
  haif resolve-conflict conflict-id --outcome=resolved --summary="..." --reviewer="..."
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

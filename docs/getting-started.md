# Getting Started With HAIF

HAIF helps teams coordinate before AI agents multiply tickets, docs, designs, and execution artifacts.

## Install

```bash
npm install
npm run build
```

## Initialize Records

```bash
node packages/cli/dist/index.js init
```

This creates `.haif/records` with stage-specific folders and creates or updates `AGENTS.md` with HAIF workflow guidance.

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

## Create A Proposal

```bash
node packages/cli/dist/index.js new proposal "Reduce duplicate agent-created Jira tickets"
```

A proposal is possible work. It is not committed work.

New records are stored by stage. For example, proposals go in `.haif/records/proposals/` and intents go in `.haif/records/intents/`.

Fill in the `tldr` field first. It should give reviewers the shortest useful summary of the proposal and the decision needed.

## Validate

```bash
node packages/cli/dist/index.js validate
```

Validation checks required metadata, owner fields, review state, conflict records, and whether agent-created records are trying to approve themselves.

## Run Preflight

```bash
node packages/cli/dist/index.js preflight --scope jira,docs
```

Preflight tells an agent or human whether the current context is ready for planning, ticket creation, documentation, or implementation.

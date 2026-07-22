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
    proposals/
    designs/
    decisions/
    conflicts/
```

HAIF starts with three working stages plus `conflicts` as the guardrail folder. Optional extension folders are created later only if the team uses those record types.

## Create A Proposal

```bash
node packages/cli/dist/index.js new proposal "Reduce duplicate agent-created Jira tickets"
```

A proposal is possible work. It is not committed work.

New records are stored by stage. For example, proposals go in `.haif/records/proposals/`, designs go in `.haif/records/designs/`, and decisions go in `.haif/records/decisions/`.

Use `--app` to organize records by application, service, or workstream:

```bash
node packages/cli/dist/index.js new proposal "Reduce duplicate agent-created Jira tickets" --app=planning
```

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

Preflight tells an agent or human whether the current context has an approved decision and no unresolved conflict before implementation.

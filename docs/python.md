# Python Support

HAIF includes a dependency-free Python package for AI engineering, data, and enterprise automation teams.

## Run Locally

```bash
cd packages/python
python -m unittest discover -s tests
```

From the repo root:

```bash
set PYTHONPATH=packages/python/src
python -m haif.cli init
python -m haif.cli new proposal "Reduce duplicate agent-created tickets"
python -m haif.cli validate
python -m haif.cli preflight --scope jira,docs
python -m haif.cli export-context
```

On macOS or Linux, use:

```bash
PYTHONPATH=packages/python/src python -m haif.cli validate
```

## Why Python

Python support makes HAIF friendlier for AI engineering and data teams, especially where future work may include semantic overlap detection, embeddings, graph analysis, Jira mining, and agent context generation.

The HAIF spec remains language-neutral. Node and Python are both implementations of the same framework.

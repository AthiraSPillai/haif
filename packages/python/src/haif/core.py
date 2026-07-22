from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple


REQUIRED_FIELDS = ["type", "id", "title", "status", "owner", "created_by", "created_at", "updated_at"]
ALLOWED_TYPES = {"Signal", "Proposal", "Intent", "Design", "Decision", "Task", "Review", "Conflict", "AgentRun"}
APPROVED_STATUSES = {"accepted", "reviewed", "approved", "released"}
RESOLVED_CONFLICT_OUTCOMES = {"resolved", "merged", "rejected", "superseded"}
RECORD_FOLDERS = {
    "Signal": "signals",
    "Proposal": "proposals",
    "Intent": "intents",
    "Design": "designs",
    "Decision": "decisions",
    "Task": "tasks",
    "Review": "reviews",
    "Conflict": "conflicts",
    "AgentRun": "agent-runs",
}
DEFAULT_INIT_FOLDERS = [
    RECORD_FOLDERS["Proposal"],
    RECORD_FOLDERS["Design"],
    RECORD_FOLDERS["Decision"],
    RECORD_FOLDERS["Conflict"],
]
HAIF_AGENT_SECTION_MARKER = "<!-- HAIF_AGENT_WORKFLOW -->"
HAIF_AGENT_SECTION = """{marker}
## HAIF Workflow

This repo uses HAIF: Human-Agent Intent Framework.

Before significant planning, ticket creation, docs, or code changes:

1. Read relevant records in `.haif/records`.
2. Run `haif preflight` if available.
3. Continue to implementation only if there is an approved HAIF `Decision` and no unresolved conflict.
4. If alignment is missing, create a HAIF `Proposal` instead of starting implementation.
5. If solution details are unclear, create or update a HAIF `Design`.
6. Put new agent-created docs in the matching HAIF stage folder: `proposals`, `designs`, or `decisions`, with an app/workstream subfolder when useful.
7. If a doc, ticket, design, or implementation drifts from an approved `Decision`, treat the `Decision` as source of truth and create a drift conflict:

   ```bash
   haif drift-conflict --app=app-name --decision=decision-id --artifact=doc-or-change-id --summary="Short reviewer-focused drift summary."
   ```

8. Try to correct the draft, doc, ticket, or implementation back to the approved decision. If the decision itself may need to change, stop and request human review.

Agents may create proposals and draft designs, but humans approve decisions before implementation.
""".format(marker=HAIF_AGENT_SECTION_MARKER)


@dataclass
class HaifRecord:
    path: Path
    data: Dict[str, Any]
    body: str


def records_dir(root: Optional[Path] = None) -> Path:
    return (root or Path.cwd()) / ".haif" / "records"


def reports_dir(root: Optional[Path] = None) -> Path:
    return (root or Path.cwd()) / ".haif" / "reports"


def conflict_reports_path(root: Optional[Path] = None) -> Path:
    return reports_dir(root) / "conflict-resolutions.jsonl"


def init_records(root: Optional[Path] = None) -> Path:
    directory = records_dir(root)
    directory.mkdir(parents=True, exist_ok=True)
    reports_dir(root).mkdir(parents=True, exist_ok=True)
    for folder in DEFAULT_INIT_FOLDERS:
        (directory / folder).mkdir(parents=True, exist_ok=True)
    ensure_agents_md(root)
    return directory


def ensure_agents_md(root: Optional[Path] = None) -> Path:
    base = root or Path.cwd()
    path = base / "AGENTS.md"
    if not path.exists():
        path.write_text("# Agent Instructions\n\n{}".format(HAIF_AGENT_SECTION), encoding="utf-8")
        return path
    existing = path.read_text(encoding="utf-8")
    if HAIF_AGENT_SECTION_MARKER not in existing:
        path.write_text("{}\n\n{}".format(existing.rstrip(), HAIF_AGENT_SECTION), encoding="utf-8")
    return path


def create_record(record_type: str, title: str, root: Optional[Path] = None, app: str = "", related: Sequence[str] = ()) -> Path:
    normalized = normalize_type(record_type)
    now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    record_id = "{}-{}".format(record_type.lower(), slug(title))
    init_records(root)
    directory = records_dir(root) / RECORD_FOLDERS[normalized]
    if app:
        directory = directory / slug(app)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "{}.md".format(record_id)
    if path.exists():
        raise ValueError("Record already exists: {}".format(path))

    status = "accepted" if normalized == "Intent" else "proposed"
    scope_value = "[{}]".format(slug(app)) if app else "[]"
    related_value = "[{}]".format(", ".join(related)) if related else "[]"
    path.write_text(
        "---\n"
        "type: {type}\n"
        "id: {id}\n"
        "title: {title}\n"
        "tldr: Summarize what reviewers need to know and what decision is needed.\n"
        "status: {status}\n"
        "owner: unassigned\n"
        "created_by: human\n"
        "created_at: {now}\n"
        "updated_at: {now}\n"
        "source: local\n"
        "scope: {scope}\n"
        "related: {related}\n"
        "reviewers: []\n"
        "confidence: draft\n"
        "---\n\n"
        "# {title}\n\n"
        "Describe the work, context, and review needs.\n".format(type=normalized, id=record_id, title=title, status=status, now=now, scope=scope_value, related=related_value),
        encoding="utf-8",
    )
    return path


def create_drift_conflict(app: str, decision: str, artifact: str, summary: str, root: Optional[Path] = None) -> Path:
    init_records(root)
    title = "Drift in {} from {}".format(artifact, decision)
    record_id = "conflict-{}".format(slug(title))
    now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    directory = records_dir(root) / RECORD_FOLDERS["Conflict"] / slug(app)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "{}.md".format(record_id)
    if path.exists():
        raise ValueError("Record already exists: {}".format(path))
    tldr = "{} appears to drift from approved decision {}. {}".format(artifact, decision, summary)
    path.write_text(
        "---\n"
        "type: Conflict\n"
        "id: {id}\n"
        "title: {title}\n"
        "tldr: {tldr}\n"
        "status: blocked\n"
        "owner: unassigned\n"
        "created_by: agent\n"
        "created_at: {now}\n"
        "updated_at: {now}\n"
        "source: local\n"
        "scope: [{app}]\n"
        "related: [{decision}, {artifact}]\n"
        "reviewers: []\n"
        "confidence: draft\n"
        "---\n\n"
        "# {title}\n\n"
        "## TLDR\n\n"
        "{tldr}\n\n"
        "## Source Of Truth\n\n"
        "- Approved decision: `{decision}`\n"
        "- Drifted artifact: `{artifact}`\n"
        "- App or workstream: `{app}`\n\n"
        "The approved HAIF `Decision` remains the source of truth until a human reviewer approves a new decision.\n\n"
        "## Observed Drift\n\n"
        "{summary}\n\n"
        "## Agent Action\n\n"
        "1. Compare the artifact with the approved decision.\n"
        "2. If possible, correct the artifact back to the decision.\n"
        "3. If correction would change scope, API, data model, security, ownership, or architecture, stop and request human review.\n"
        "4. Do not edit the approved decision directly.\n\n"
        "## Human Review Needed\n\n"
        "- Should the artifact be corrected to match the decision?\n"
        "- Should a new proposal or design be created to change the approved direction?\n"
        "- Should this conflict be resolved with `haif resolve-conflict` after review?\n".format(id=record_id, title=title, tldr=tldr, now=now, app=slug(app), decision=decision, artifact=artifact, summary=summary),
        encoding="utf-8",
    )
    return path


def load_records(root: Optional[Path] = None) -> List[HaifRecord]:
    directory = records_dir(root)
    if not directory.exists():
        return []
    return [parse_record(path) for path in sorted(directory.rglob("*.md"))]


def parse_record(path: Path) -> HaifRecord:
    raw = path.read_text(encoding="utf-8")
    match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$", raw)
    if not match:
        return HaifRecord(path=path, data={}, body=raw)
    return HaifRecord(path=path, data=parse_yaml_lite(match.group(1)), body=match.group(2))


def parse_yaml_lite(value: str) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    for line in value.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or ":" not in stripped:
            continue
        key, raw = stripped.split(":", 1)
        data[key.strip()] = parse_value(raw.strip())
    return data


def parse_value(raw: str) -> Any:
    if raw == "[]":
        return []
    if raw.startswith("[") and raw.endswith("]"):
        inner = raw[1:-1].strip()
        if not inner:
            return []
        return [item.strip().strip("\"'") for item in inner.split(",")]
    return raw.strip("\"'")


def validate_records(records: Sequence[HaifRecord]) -> List[str]:
    issues: List[str] = []
    for record in records:
        issues.extend(validate_record(record))
    issues.extend(validate_conflict_resolution_log())
    return issues


def validate_record(record: HaifRecord) -> List[str]:
    issues: List[str] = []
    for field in REQUIRED_FIELDS:
        if not record.data.get(field):
            issues.append("{} missing {}".format(record.path.name, field))
    record_type = record.data.get("type")
    if record_type and record_type not in ALLOWED_TYPES:
        issues.append("{} has invalid type {}".format(record.path.name, record_type))
    if record.data.get("owner") == "unassigned" and str(record.data.get("status")) in APPROVED_STATUSES:
        issues.append("{} has approved-like status with unassigned owner".format(record.path.name))
    if record.data.get("created_by") == "agent" and str(record.data.get("status")) in {"accepted", "approved", "released"}:
        issues.append("{} is agent-created but appears self-approved".format(record.path.name))
    if record.data.get("type") == "Decision" and record.data.get("status") == "approved" and not as_list(record.data.get("reviewers")):
        issues.append("{} is an approved decision with no reviewers".format(record.path.name))
    return issues


def preflight(records: Sequence[HaifRecord], scope: Sequence[str] = ()) -> List[str]:
    scoped = filter_by_scope(records, scope)
    resolved = resolved_conflict_ids()
    issues: List[str] = []
    approved_decision = any(record.data.get("type") == "Decision" and record.data.get("status") == "approved" for record in scoped)
    unresolved_conflict = any(
        record.data.get("type") == "Conflict"
        and str(record.data.get("id")) not in resolved
        and str(record.data.get("status")) not in {"rejected", "superseded", "released"}
        for record in scoped
    )
    if not approved_decision:
        issues.append("No approved decision found for this scope.")
    if unresolved_conflict:
        issues.append("Unresolved conflict found for this scope.")
    return issues


def resolve_conflict(conflict_id: str, outcome: str, summary: str, reviewer: str, related: Sequence[str] = (), root: Optional[Path] = None) -> Dict[str, Any]:
    if outcome not in RESOLVED_CONFLICT_OUTCOMES:
        raise ValueError("Invalid outcome {}. Use one of: {}".format(outcome, ", ".join(sorted(RESOLVED_CONFLICT_OUTCOMES))))
    conflicts = [record for record in load_records(root) if record.data.get("type") == "Conflict" and record.data.get("id") == conflict_id]
    if not conflicts:
        raise ValueError("Conflict record not found: {}".format(conflict_id))
    reports = load_conflict_resolution_reports(root)
    previous_hash = reports[-1]["hash"] if reports else "GENESIS"
    report = {
        "type": "ConflictResolution",
        "conflict_id": conflict_id,
        "outcome": outcome,
        "summary": summary,
        "reviewer": reviewer,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "related": list(related),
        "previous_hash": previous_hash,
    }
    report["hash"] = hash_report(report)
    reports_dir(root).mkdir(parents=True, exist_ok=True)
    with conflict_reports_path(root).open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(report, separators=(",", ":")) + "\n")
    return report


def validate_conflict_resolution_log(root: Optional[Path] = None) -> List[str]:
    issues: List[str] = []
    previous_hash = "GENESIS"
    path = conflict_reports_path(root)
    if not path.exists():
        return issues
    reports: List[Dict[str, Any]] = []
    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            reports.append(json.loads(line))
        except ValueError:
            issues.append("conflict-resolutions.jsonl line {} is invalid JSON".format(index))
    for index, report in enumerate(reports, start=1):
        if report.get("previous_hash") != previous_hash:
            issues.append("conflict-resolutions.jsonl line {} has invalid previous_hash".format(index))
        expected_hash = hash_report({key: value for key, value in report.items() if key != "hash"})
        if report.get("hash") != expected_hash:
            issues.append("conflict-resolutions.jsonl line {} hash mismatch; report may have been edited".format(index))
        previous_hash = str(report.get("hash"))
    return issues


def load_conflict_resolution_reports(root: Optional[Path] = None, throw_on_invalid_json: bool = True) -> List[Dict[str, Any]]:
    path = conflict_reports_path(root)
    if not path.exists():
        return []
    reports: List[Dict[str, Any]] = []
    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            reports.append(json.loads(line))
        except ValueError:
            if throw_on_invalid_json:
                raise ValueError("Invalid JSON in conflict-resolutions.jsonl line {}".format(index))
    return reports


def resolved_conflict_ids(root: Optional[Path] = None) -> Set[str]:
    return {
        str(report.get("conflict_id"))
        for report in load_conflict_resolution_reports(root)
        if report.get("outcome") in RESOLVED_CONFLICT_OUTCOMES
    }


def hash_report(report: Dict[str, Any]) -> str:
    payload = json.dumps(report, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def detect_overlap(records: Sequence[HaifRecord]) -> List[Tuple[str, str, int]]:
    pairs: List[Tuple[str, str, int]] = []
    for index, first in enumerate(records):
        for second in records[index + 1 :]:
            score = overlap_score(first, second)
            if score >= 3:
                pairs.append((str(first.data.get("id")), str(second.data.get("id")), score))
    return pairs


def export_context(records: Sequence[HaifRecord], scope: Sequence[str] = ()) -> str:
    scoped = filter_by_scope(records, scope)
    sections = ["# HAIF Trusted Context\n"]
    for record in scoped:
        sections.append("## {type}: {title}".format(type=record.data.get("type"), title=record.data.get("title")))
        sections.append("- id: {}".format(record.data.get("id")))
        sections.append("- status: {}".format(record.data.get("status")))
        sections.append("- owner: {}".format(record.data.get("owner")))
        if record.data.get("tldr"):
            sections.append("- tldr: {}".format(record.data.get("tldr")))
        sections.append("")
        sections.append(record.body.strip())
        sections.append("\n---\n")
    return "\n".join(sections)


def filter_by_scope(records: Sequence[HaifRecord], scope: Sequence[str]) -> List[HaifRecord]:
    if not scope:
        return list(records)
    wanted = set(scope)
    return [record for record in records if wanted.intersection(as_list(record.data.get("scope")))]


def overlap_score(first: HaifRecord, second: HaifRecord) -> int:
    first_tokens = tokens("{} {} {}".format(first.data.get("title", ""), first.body, " ".join(as_list(first.data.get("scope")))))
    second_tokens = tokens("{} {} {}".format(second.data.get("title", ""), second.body, " ".join(as_list(second.data.get("scope")))))
    return len(first_tokens.intersection(second_tokens))


def tokens(value: str) -> Set[str]:
    return {token for token in re.split(r"[^a-z0-9]+", value.lower()) if len(token) > 3}


def as_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    return []


def normalize_type(raw_type: str) -> str:
    mapping = {
        "signal": "Signal",
        "proposal": "Proposal",
        "intent": "Intent",
        "design": "Design",
        "decision": "Decision",
        "task": "Task",
        "review": "Review",
        "conflict": "Conflict",
        "agent-run": "AgentRun",
        "agentrun": "AgentRun",
    }
    normalized = mapping.get(raw_type.lower())
    if not normalized:
        raise ValueError("Unsupported record type: {}".format(raw_type))
    return normalized


def slug(value: str) -> str:
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))[:80]

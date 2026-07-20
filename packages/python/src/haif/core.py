from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple


REQUIRED_FIELDS = ["type", "id", "title", "status", "owner", "created_by", "created_at", "updated_at"]
ALLOWED_TYPES = {"Signal", "Proposal", "Intent", "Design", "Decision", "Task", "Review", "Conflict", "AgentRun"}
APPROVED_STATUSES = {"accepted", "reviewed", "approved", "released"}


@dataclass
class HaifRecord:
    path: Path
    data: Dict[str, Any]
    body: str


def records_dir(root: Optional[Path] = None) -> Path:
    return (root or Path.cwd()) / ".haif" / "records"


def init_records(root: Optional[Path] = None) -> Path:
    directory = records_dir(root)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def create_record(record_type: str, title: str, root: Optional[Path] = None) -> Path:
    normalized = normalize_type(record_type)
    now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    record_id = "{}-{}".format(record_type.lower(), slug(title))
    directory = init_records(root)
    path = directory / "{}.md".format(record_id)
    if path.exists():
        raise ValueError("Record already exists: {}".format(path))

    status = "accepted" if normalized == "Intent" else "proposed"
    path.write_text(
        "---\n"
        "type: {type}\n"
        "id: {id}\n"
        "title: {title}\n"
        "status: {status}\n"
        "owner: unassigned\n"
        "created_by: human\n"
        "created_at: {now}\n"
        "updated_at: {now}\n"
        "source: local\n"
        "scope: []\n"
        "related: []\n"
        "reviewers: []\n"
        "confidence: draft\n"
        "---\n\n"
        "# {title}\n\n"
        "Describe the work, context, and review needs.\n".format(type=normalized, id=record_id, title=title, status=status, now=now),
        encoding="utf-8",
    )
    return path


def load_records(root: Optional[Path] = None) -> List[HaifRecord]:
    directory = records_dir(root)
    if not directory.exists():
        return []
    return [parse_record(path) for path in sorted(directory.glob("*.md"))]


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
    issues: List[str] = []
    accepted_intent = any(record.data.get("type") == "Intent" and str(record.data.get("status")) in APPROVED_STATUSES for record in scoped)
    approved_decision = any(record.data.get("type") == "Decision" and record.data.get("status") == "approved" for record in scoped)
    unresolved_conflict = any(
        record.data.get("type") == "Conflict" and str(record.data.get("status")) not in {"rejected", "superseded", "released"}
        for record in scoped
    )
    if not accepted_intent:
        issues.append("No accepted intent found for this scope.")
    if not approved_decision:
        issues.append("No approved decision found for this scope.")
    if unresolved_conflict:
        issues.append("Unresolved conflict found for this scope.")
    return issues


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

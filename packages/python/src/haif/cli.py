from __future__ import annotations

import argparse
from pathlib import Path
import sys

from .core import create_record, detect_overlap, export_context, init_records, load_records, preflight, validate_records


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="haif-py", description="Python CLI for HAIF: Human-Agent Intent Framework")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("init")
    subparsers.add_parser("validate")
    subparsers.add_parser("detect-overlap")
    subparsers.add_parser("review-status")

    new_parser = subparsers.add_parser("new")
    new_parser.add_argument("type")
    new_parser.add_argument("title", nargs="+")

    preflight_parser = subparsers.add_parser("preflight")
    preflight_parser.add_argument("--scope", default="")

    export_parser = subparsers.add_parser("export-context")
    export_parser.add_argument("--scope", default="")

    args = parser.parse_args(argv)
    if args.command == "init":
        directory = init_records()
        print("Initialized HAIF records at {}".format(directory))
        return 0
    if args.command == "new":
        path = create_record(args.type, " ".join(args.title))
        print("Created {}".format(path))
        return 0
    if args.command == "validate":
        issues = validate_records(load_records())
        if issues:
            print("HAIF validation failed:", file=sys.stderr)
            for issue in issues:
                print("- {}".format(issue), file=sys.stderr)
            return 1
        print("HAIF validation passed.")
        return 0
    if args.command == "preflight":
        issues = preflight(load_records(), parse_scope(args.scope))
        if issues:
            print("HAIF preflight: review needed")
            for issue in issues:
                print("- {}".format(issue))
            return 1
        print("HAIF preflight: ready for agent-assisted work.")
        return 0
    if args.command == "detect-overlap":
        pairs = detect_overlap(load_records())
        if not pairs:
            print("No likely overlaps detected.")
            return 0
        print("Likely overlaps:")
        for first, second, score in pairs:
            print("- {} <-> {} ({})".format(first, second, score))
        return 1
    if args.command == "review-status":
        pending = [record for record in load_records() if str(record.data.get("status")) in {"proposed", "draft", "blocked"}]
        if not pending:
            print("No pending HAIF review items.")
            return 0
        print("Pending HAIF review items:")
        for record in pending:
            print("- {}: {} ({})".format(record.data.get("id"), record.data.get("title"), record.data.get("status")))
        return 1
    if args.command == "export-context":
        print(export_context(load_records(), parse_scope(args.scope)))
        return 0

    parser.print_help()
    return 0


def parse_scope(value: str):
    return [item.strip() for item in value.split(",") if item.strip()]


if __name__ == "__main__":
    raise SystemExit(main())

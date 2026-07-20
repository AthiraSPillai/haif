#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

type RecordType =
  | "Signal"
  | "Proposal"
  | "Intent"
  | "Design"
  | "Decision"
  | "Task"
  | "Review"
  | "Conflict"
  | "AgentRun";

type HaifRecord = {
  path: string;
  body: string;
  data: Record<string, unknown>;
};

const requiredFields = ["type", "id", "title", "status", "owner", "created_by", "created_at", "updated_at"];
const allowedTypes = new Set<RecordType>([
  "Signal",
  "Proposal",
  "Intent",
  "Design",
  "Decision",
  "Task",
  "Review",
  "Conflict",
  "AgentRun",
]);
const approvedStatuses = new Set(["accepted", "reviewed", "approved", "released"]);

export function main(args: string[]): number {
  const [command, ...rest] = args;
  try {
    switch (command) {
      case "init":
        return init();
      case "validate":
        return validate();
      case "new":
        return createRecord(rest);
      case "preflight":
        return preflight(rest);
      case "detect-overlap":
        return detectOverlap();
      case "review-status":
        return reviewStatus();
      case "export-context":
        return exportContext(rest);
      case "-h":
      case "--help":
      case undefined:
        printHelp();
        return 0;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        return 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function recordsDir(): string {
  return resolve(process.cwd(), ".haif", "records");
}

function init(): number {
  mkdirSync(recordsDir(), { recursive: true });
  console.log(`Initialized HAIF records at ${recordsDir()}`);
  return 0;
}

function createRecord(args: string[]): number {
  const [rawType, ...titleParts] = args;
  if (!rawType || titleParts.length === 0) {
    throw new Error("Usage: haif new <proposal|intent|design|decision|task|review|conflict|agent-run|signal> <title>");
  }

  const type = normalizeType(rawType);
  const title = titleParts.join(" ");
  const now = new Date().toISOString();
  const id = `${rawType.toLowerCase()}-${slug(title)}`;
  mkdirSync(recordsDir(), { recursive: true });
  const path = join(recordsDir(), `${id}.md`);
  if (existsSync(path)) {
    throw new Error(`Record already exists: ${path}`);
  }

  const content = `---\ntype: ${type}\nid: ${id}\ntitle: ${title}\nstatus: ${type === "Intent" ? "accepted" : "proposed"}\nowner: unassigned\ncreated_by: human\ncreated_at: ${now}\nupdated_at: ${now}\nsource: local\nscope: []\nrelated: []\nreviewers: []\nconfidence: draft\n---\n\n# ${title}\n\nDescribe the work, context, and review needs.\n`;
  writeFileSync(path, content, "utf8");
  console.log(`Created ${path}`);
  return 0;
}

function validate(): number {
  const records = loadRecords();
  const issues: string[] = [];
  for (const record of records) {
    issues.push(...validateRecord(record));
  }

  if (issues.length > 0) {
    console.error("HAIF validation failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    return 1;
  }
  console.log(`HAIF validation passed for ${records.length} record(s).`);
  return 0;
}

function preflight(args: string[]): number {
  const scope = parseScope(args);
  const records = filterByScope(loadRecords(), scope);
  const issues: string[] = [];
  const acceptedIntent = records.some((record) => record.data.type === "Intent" && approvedStatuses.has(String(record.data.status)));
  const approvedDecision = records.some((record) => record.data.type === "Decision" && String(record.data.status) === "approved");
  const unresolvedConflict = records.some((record) => record.data.type === "Conflict" && !["rejected", "superseded", "released"].includes(String(record.data.status)));

  if (!acceptedIntent) issues.push("No accepted intent found for this scope.");
  if (!approvedDecision) issues.push("No approved decision found for this scope.");
  if (unresolvedConflict) issues.push("Unresolved conflict found for this scope.");

  if (issues.length > 0) {
    console.log("HAIF preflight: review needed");
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
    return 1;
  }

  console.log("HAIF preflight: ready for agent-assisted work.");
  return 0;
}

function detectOverlap(): number {
  const records = loadRecords();
  const pairs: string[] = [];
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const score = overlapScore(records[i], records[j]);
      if (score >= 3) {
        pairs.push(`${records[i].data.id} <-> ${records[j].data.id} (${score})`);
      }
    }
  }
  if (pairs.length === 0) {
    console.log("No likely overlaps detected.");
    return 0;
  }
  console.log("Likely overlaps:");
  for (const pair of pairs) console.log(`- ${pair}`);
  return 1;
}

function reviewStatus(): number {
  const records = loadRecords();
  const pending = records.filter((record) => ["proposed", "draft", "blocked"].includes(String(record.data.status)));
  if (pending.length === 0) {
    console.log("No pending HAIF review items.");
    return 0;
  }
  console.log("Pending HAIF review items:");
  for (const record of pending) {
    console.log(`- ${record.data.id}: ${record.data.title} (${record.data.status})`);
  }
  return 1;
}

function exportContext(args: string[]): number {
  const scope = parseScope(args);
  const records = filterByScope(loadRecords(), scope);
  console.log("# HAIF Trusted Context\n");
  for (const record of records) {
    console.log(`## ${record.data.type}: ${record.data.title}`);
    console.log(`- id: ${record.data.id}`);
    console.log(`- status: ${record.data.status}`);
    console.log(`- owner: ${record.data.owner}`);
    console.log("");
    console.log(record.body.trim());
    console.log("\n---\n");
  }
  return 0;
}

function loadRecords(): HaifRecord[] {
  const dir = recordsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parseRecord(join(dir, file)));
}

function parseRecord(path: string): HaifRecord {
  const raw = readFileSync(path, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { path, body: raw, data: {} };
  }
  return { path, body: match[2], data: parseYamlLite(match[1]) };
}

function parseYamlLite(input: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf(":");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    data[key] = parseValue(rawValue);
  }
  return data;
}

function parseValue(rawValue: string): unknown {
  if (rawValue === "[]") return [];
  if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
    const inner = rawValue.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((value) => value.trim().replace(/^["']|["']$/g, ""));
  }
  return rawValue.replace(/^["']|["']$/g, "");
}

function validateRecord(record: HaifRecord): string[] {
  const issues: string[] = [];
  for (const field of requiredFields) {
    if (!record.data[field]) issues.push(`${basename(record.path)} missing ${field}`);
  }
  if (record.data.type && !allowedTypes.has(record.data.type as RecordType)) {
    issues.push(`${basename(record.path)} has invalid type ${String(record.data.type)}`);
  }
  if (record.data.owner === "unassigned" && approvedStatuses.has(String(record.data.status))) {
    issues.push(`${basename(record.path)} has approved-like status with unassigned owner`);
  }
  if (record.data.created_by === "agent" && ["accepted", "approved", "released"].includes(String(record.data.status))) {
    issues.push(`${basename(record.path)} is agent-created but appears self-approved`);
  }
  if (record.data.type === "Decision" && record.data.status === "approved" && arrayValue(record.data.reviewers).length === 0) {
    issues.push(`${basename(record.path)} is an approved decision with no reviewers`);
  }
  return issues;
}

function parseScope(args: string[]): string[] {
  const scopeArg = args.find((arg) => arg.startsWith("--scope="));
  if (!scopeArg) return [];
  return scopeArg.slice("--scope=".length).split(",").map((value) => value.trim()).filter(Boolean);
}

function filterByScope(records: HaifRecord[], scope: string[]): HaifRecord[] {
  if (scope.length === 0) return records;
  return records.filter((record) => arrayValue(record.data.scope).some((value) => scope.includes(value)));
}

function overlapScore(a: HaifRecord, b: HaifRecord): number {
  const tokensA = tokens(`${a.data.title ?? ""} ${a.body} ${arrayValue(a.data.scope).join(" ")}`);
  const tokensB = tokens(`${b.data.title ?? ""} ${b.body} ${arrayValue(b.data.scope).join(" ")}`);
  let score = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) score += 1;
  }
  return score;
}

function tokens(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3));
}

function arrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function normalizeType(rawType: string): RecordType {
  const normalized = rawType.toLowerCase();
  const mapping: Record<string, RecordType> = {
    signal: "Signal",
    proposal: "Proposal",
    intent: "Intent",
    design: "Design",
    decision: "Decision",
    task: "Task",
    review: "Review",
    conflict: "Conflict",
    "agent-run": "AgentRun",
    agentrun: "AgentRun",
  };
  const type = mapping[normalized];
  if (!type) throw new Error(`Unsupported record type: ${rawType}`);
  return type;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function printHelp(): void {
  console.log(`HAIF: Human-Agent Intent Framework

Usage:
  haif init
  haif validate
  haif new <type> <title>
  haif preflight [--scope=a,b]
  haif detect-overlap
  haif review-status
  haif export-context [--scope=a,b]`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}

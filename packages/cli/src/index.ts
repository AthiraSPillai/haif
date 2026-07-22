#!/usr/bin/env node
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

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

type ConflictResolutionReport = {
  type: "ConflictResolution";
  conflict_id: string;
  outcome: string;
  summary: string;
  reviewer: string;
  created_at: string;
  related: string[];
  previous_hash: string;
  hash: string;
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
const resolvedConflictOutcomes = new Set(["resolved", "merged", "rejected", "superseded"]);
const recordFolders: Record<RecordType, string> = {
  Signal: "signals",
  Proposal: "proposals",
  Intent: "intents",
  Design: "designs",
  Decision: "decisions",
  Task: "tasks",
  Review: "reviews",
  Conflict: "conflicts",
  AgentRun: "agent-runs",
};
const haifAgentSectionMarker = "<!-- HAIF_AGENT_WORKFLOW -->";
const haifAgentSection = `${haifAgentSectionMarker}
## HAIF Workflow

This repo uses HAIF: Human-Agent Intent Framework.

Before significant planning, ticket creation, docs, or code changes:

1. Read relevant records in \`.haif/records\`.
2. Run \`haif preflight\` if available.
3. Continue only if there is accepted intent and no unresolved conflict.
4. If intent is missing, create a HAIF \`Proposal\` instead of starting implementation.
5. If implementation changes scope, APIs, data models, security, or architecture, stop and request human review.

Agents may propose work, but humans approve intent, design, decisions, and release readiness.
`;

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
      case "resolve-conflict":
        return resolveConflict(rest);
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

function reportsDir(): string {
  return resolve(process.cwd(), ".haif", "reports");
}

function conflictReportsPath(): string {
  return join(reportsDir(), "conflict-resolutions.jsonl");
}

function init(): number {
  mkdirSync(recordsDir(), { recursive: true });
  mkdirSync(reportsDir(), { recursive: true });
  for (const folder of Object.values(recordFolders)) {
    mkdirSync(join(recordsDir(), folder), { recursive: true });
  }
  const agentPath = resolve(process.cwd(), "AGENTS.md");
  if (!existsSync(agentPath)) {
    writeFileSync(agentPath, `# Agent Instructions\n\n${haifAgentSection}`, "utf8");
    console.log(`Created ${agentPath}`);
  } else {
    const existing = readFileSync(agentPath, "utf8");
    if (!existing.includes(haifAgentSectionMarker)) {
      writeFileSync(agentPath, `${existing.trimEnd()}\n\n${haifAgentSection}`, "utf8");
      console.log(`Updated ${agentPath}`);
    }
  }
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
  const directory = join(recordsDir(), recordFolders[type]);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${id}.md`);
  if (existsSync(path)) {
    throw new Error(`Record already exists: ${path}`);
  }

  const content = `---\ntype: ${type}\nid: ${id}\ntitle: ${title}\ntldr: Summarize what reviewers need to know and what decision is needed.\nstatus: ${type === "Intent" ? "accepted" : "proposed"}\nowner: unassigned\ncreated_by: human\ncreated_at: ${now}\nupdated_at: ${now}\nsource: local\nscope: []\nrelated: []\nreviewers: []\nconfidence: draft\n---\n\n# ${title}\n\nDescribe the work, context, and review needs.\n`;
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
  issues.push(...validateConflictResolutionLog());

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
  const resolvedConflicts = resolvedConflictIds();
  const issues: string[] = [];
  const acceptedIntent = records.some((record) => record.data.type === "Intent" && approvedStatuses.has(String(record.data.status)));
  const approvedDecision = records.some((record) => record.data.type === "Decision" && String(record.data.status) === "approved");
  const unresolvedConflict = records.some((record) => record.data.type === "Conflict" && !resolvedConflicts.has(String(record.data.id)) && !["rejected", "superseded", "released"].includes(String(record.data.status)));

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
    if (record.data.tldr) console.log(`  ${record.data.tldr}`);
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
    if (record.data.tldr) console.log(`- tldr: ${record.data.tldr}`);
    console.log("");
    console.log(record.body.trim());
    console.log("\n---\n");
  }
  return 0;
}

function resolveConflict(args: string[]): number {
  const [conflictId, ...rest] = args;
  if (!conflictId) {
    throw new Error("Usage: haif resolve-conflict <conflict-id> --outcome=resolved --summary=\"...\" --reviewer=\"...\" [--related=a,b]");
  }
  const outcome = requiredOption(rest, "outcome");
  const summary = requiredOption(rest, "summary");
  const reviewer = requiredOption(rest, "reviewer");
  if (!resolvedConflictOutcomes.has(outcome)) {
    throw new Error(`Invalid outcome ${outcome}. Use one of: ${Array.from(resolvedConflictOutcomes).join(", ")}`);
  }
  const conflicts = loadRecords().filter((record) => record.data.type === "Conflict" && record.data.id === conflictId);
  if (conflicts.length === 0) {
    throw new Error(`Conflict record not found: ${conflictId}`);
  }
  const reports = loadConflictResolutionReports();
  const previousHash = reports.length > 0 ? reports[reports.length - 1].hash : "GENESIS";
  const reportWithoutHash = {
    type: "ConflictResolution" as const,
    conflict_id: conflictId,
    outcome,
    summary,
    reviewer,
    created_at: new Date().toISOString(),
    related: optionValue(rest, "related").split(",").map((value) => value.trim()).filter(Boolean),
    previous_hash: previousHash,
  };
  const report: ConflictResolutionReport = {
    ...reportWithoutHash,
    hash: hashReport(reportWithoutHash),
  };
  mkdirSync(reportsDir(), { recursive: true });
  appendFileSync(conflictReportsPath(), `${JSON.stringify(report)}\n`, "utf8");
  console.log(`Appended conflict resolution report for ${conflictId}`);
  console.log(`hash=${report.hash}`);
  return 0;
}

function loadRecords(): HaifRecord[] {
  const dir = recordsDir();
  if (!existsSync(dir)) return [];
  return findMarkdownFiles(dir).map((file) => parseRecord(file));
}

function findMarkdownFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }
  return files.sort();
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

function validateConflictResolutionLog(): string[] {
  const issues: string[] = [];
  const path = conflictReportsPath();
  if (!existsSync(path)) return issues;
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line.trim().length > 0);
  const reports: ConflictResolutionReport[] = [];
  for (const [index, line] of lines.entries()) {
    try {
      reports.push(JSON.parse(line) as ConflictResolutionReport);
    } catch {
      issues.push(`conflict-resolutions.jsonl line ${index + 1} is invalid JSON`);
    }
  }
  let previousHash = "GENESIS";
  for (const [index, report] of reports.entries()) {
    const expectedPrevious = previousHash;
    if (report.previous_hash !== expectedPrevious) {
      issues.push(`conflict-resolutions.jsonl line ${index + 1} has invalid previous_hash`);
    }
    const { hash, ...withoutHash } = report;
    const expectedHash = hashReport(withoutHash);
    if (hash !== expectedHash) {
      issues.push(`conflict-resolutions.jsonl line ${index + 1} hash mismatch; report may have been edited`);
    }
    previousHash = hash;
  }
  return issues;
}

function loadConflictResolutionReports(throwOnInvalidJson = true): ConflictResolutionReport[] {
  const path = conflictReportsPath();
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line.trim().length > 0);
  const reports: ConflictResolutionReport[] = [];
  for (const [index, line] of lines.entries()) {
    try {
      reports.push(JSON.parse(line) as ConflictResolutionReport);
    } catch (error) {
      if (throwOnInvalidJson) throw new Error(`Invalid JSON in conflict-resolutions.jsonl line ${index + 1}`);
    }
  }
  return reports;
}

function resolvedConflictIds(): Set<string> {
  const ids = new Set<string>();
  for (const report of loadConflictResolutionReports()) {
    if (resolvedConflictOutcomes.has(report.outcome)) ids.add(report.conflict_id);
  }
  return ids;
}

function hashReport(report: Omit<ConflictResolutionReport, "hash">): string {
  return createHash("sha256").update(stableStringify(report)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseScope(args: string[]): string[] {
  const scopeArg = args.find((arg) => arg.startsWith("--scope="));
  if (!scopeArg) return [];
  return scopeArg.slice("--scope=".length).split(",").map((value) => value.trim()).filter(Boolean);
}

function requiredOption(args: string[], name: string): string {
  const value = optionValue(args, name);
  if (!value) throw new Error(`Missing --${name}=...`);
  return value;
}

function optionValue(args: string[], name: string): string {
  const prefix = `--${name}=`;
  const arg = args.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : "";
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
  haif export-context [--scope=a,b]
  haif resolve-conflict <conflict-id> --outcome=resolved --summary="..." --reviewer="..."`);
}

process.exitCode = main(process.argv.slice(2));

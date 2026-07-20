import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../dist/index.js";

function run(args, cwd) {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return main(args);
  } finally {
    process.chdir(previous);
  }
}

const workspace = mkdtempSync(join(tmpdir(), "haif-test-"));
try {
  assert.equal(run(["init"], workspace), 0);
  assert.equal(run(["new", "proposal", "Improve shared intent"], workspace), 0);
  assert.equal(run(["validate"], workspace), 0);
  assert.notEqual(run(["preflight"], workspace), 0);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

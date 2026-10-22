// Copyright (c) "Neo4j"
// Neo4j Sweden AB [http://neo4j.com]
//
// Adds the copyright header to every code file in all the GRANDstack repositories beside this one, or checks that it is there.
// The rules live in the organisation's `.github` repository (scripts/headers.mjs), which CI uses too; this runs them over every repo.
//   node scripts/add-headers.mjs            add the header where it is missing
//   node scripts/add-headers.mjs --check    list files without it, exit 1 if any
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ws = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(ws, ".github", "scripts", "headers.mjs");
if (!existsSync(script)) { console.error(`Expected the .github repository at ${join(ws, ".github")}`); process.exit(2); }
const repos = [".github", "grandstack", "grandstack-server", "grandstack-web", "grandstack-auth", "grandstack-agents", "grandstack-federation", "grand-stack.github.io"];
let failed = false;
for (const repo of repos) {
  if (!existsSync(join(ws, repo))) continue;
  const result = spawnSync("node", [script, "--root", join(ws, repo), ...process.argv.slice(2)], { encoding: "utf8" });
  const lines = (result.stdout + result.stderr).trim().split("\n").filter(Boolean);
  console.log(`${repo}: ${lines.at(-1) ?? ""}`);
  if (process.argv.includes("--check")) lines.slice(0, -1).forEach((l) => console.log(`  ${l}`));
  if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);

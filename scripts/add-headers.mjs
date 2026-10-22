// Copyright (c) "Neo4j"
// Neo4j Sweden AB [http://neo4j.com]
//
// Adds the copyright header to every code file in the GRANDstack repositories (the umbrella and its siblings), or checks that it is there.
//   node scripts/add-headers.mjs            add the header where it is missing
//   node scripts/add-headers.mjs --check    list files without it, exit 1 if any
// Code files are the ones in the table below. Not covered: Markdown, JSON, SVG, lock files, patches, plain-text data, and generated
// files (codegen output, the composed supergraph). The header is two lines, in each language's comment syntax.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repos = ["grandstack", "grandstack-server", "grandstack-web", "grandstack-auth", "grandstack-agents", "grandstack-federation", "grand-stack.github.io"];
const check = process.argv.includes("--check");
const MARK = "Neo4j Sweden AB";
const LINES = ['Copyright (c) "Neo4j"', "Neo4j Sweden AB [http://neo4j.com]"];

const slash = (t) => t.map((l) => `// ${l}`).join("\n");
const hash = (t) => t.map((l) => `# ${l}`).join("\n");
const block = (t) => `/*\n${t.map((l) => ` * ${l}`).join("\n")}\n */`;
const hugo = (t) => `{{- /*\n${t.map((l) => `  ${l}`).join("\n")}\n*/ -}}`;
const htmlc = (t) => `<!--\n${t.map((l) => `  ${l}`).join("\n")}\n-->`;

const byExt = { ".ts": slash, ".tsx": slash, ".mts": slash, ".cts": slash, ".js": slash, ".mjs": slash, ".cjs": slash, ".cypher": slash, ".graphql": hash, ".yaml": hash, ".yml": hash, ".sh": hash, ".conf": hash, ".toml": hash, ".css": block };
const generated = [/\/generated\//, /^codegen\.ts$/, /(^|\/)supergraph\.graphql$/, /^content\/docs\//, /^static\//, /^public\//, /^resources\//, /node_modules\//];
const isGenerated = (f) => generated.some((re) => re.test(f)) && !/^codegen\.ts$/.test(f);

function styleFor(repo, file) {
  const name = basename(file);
  if (name === "Dockerfile" || name.startsWith("Dockerfile.")) return hash;
  const ext = extname(file);
  if (ext === ".html") return repo === "grand-stack.github.io" && file.startsWith("layouts/") ? hugo : htmlc;
  if (ext === ".txt" && repo === "grand-stack.github.io" && file.startsWith("layouts/")) return hugo;
  return byExt[ext];
}

let missing = 0, changed = 0;
for (const repo of repos) {
  const dir = join(here, "..", repo);
  if (!existsSync(dir)) continue;
  for (const file of execSync("git ls-files", { cwd: dir }).toString().split("\n").filter(Boolean)) {
    if (isGenerated(file)) continue;
    const style = styleFor(repo, file);
    if (!style) continue;
    const path = join(dir, file);
    const text = readFileSync(path, "utf8");
    if (text.split("\n").slice(0, 8).join("\n").includes(MARK)) continue;
    missing++;
    if (check) { console.log(`missing: ${repo}/${file}`); continue; }
    const header = style(LINES);
    const lines = text.split("\n");
    let next;
    if (lines[0].startsWith("#!")) next = [lines[0], header, ...lines.slice(1)].join("\n");
    else if (/^<!doctype/i.test(lines[0])) next = [lines[0], header, ...lines.slice(1)].join("\n"); // keep the doctype first
    else next = `${header}\n${text}`;
    writeFileSync(path, next);
    changed++;
  }
}
console.log(check ? `${missing} file(s) without the header` : `${changed} file(s) updated`);
if (check && missing) process.exit(1);

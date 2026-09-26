import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, realpath } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const read = (p) => readFile(resolve(root, p), 'utf8');
const registry = JSON.parse(await read('.harness/source-doc-registry.json'));
const manifest = JSON.parse(await read('.harness/api-operations.json'));
assert.equal(manifest.backendCommit, registry.backendCommit);
assert.equal(manifest.operations.length, 57);
const operationSet = new Set(manifest.operations.map((o) => `${o.method} ${o.path}`));
assert.equal(operationSet.size, 57);
assert.equal(new Set(manifest.operations.map((o) => o.path)).size, 38);
assert.equal(new Set(manifest.operations.map((o) => o.id)).size, 57);

for (const snapshot of registry.snapshots) {
  const bytes = await readFile(resolve(root, snapshot.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), snapshot.sha256,
    `Pinned snapshot changed: ${snapshot.path}`);
}

const controllers = await read('docs/references/backend/controller-source.md');
const parsedOperations = new Set();
for (const section of controllers.split(/^## /m).slice(1)) {
  const base = section.match(/@RequestMapping\("([^"]+)"\)/)?.[1];
  assert.ok(base, 'Controller request mapping missing');
  for (const match of section.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^\n]*)\))?/g)) {
    const suffix = match[2]?.match(/"([^"]*)"/)?.[1] ?? '';
    parsedOperations.add(`${match[1].toUpperCase()} ${base}${suffix}`);
  }
}
assert.deepEqual([...parsedOperations].sort(), [...operationSet].sort(), 'Controller/manifest drift');

const coverage = await read('docs/references/API_UI_COVERAGE.md');
const coverageRows = [...coverage.matchAll(/^\| (FEAPI-\d{3}) \| (GET|POST|PUT|PATCH|DELETE) \| `([^`]+)`/gm)];
assert.equal(coverageRows.length, 57);
assert.deepEqual(coverageRows.map((m) => `${m[2]} ${m[3]}`).sort(), [...operationSet].sort());
const inventory = await read('docs/product-specs/UI_INVENTORY.md');
const ids = [...inventory.matchAll(/^\| (UI\d{2}) \|/gm)].map((m) => m[1]);
assert.deepEqual(ids, Array.from({ length: 22 }, (_, i) => `UI${String(i + 1).padStart(2, '0')}`));

const skill = await read('.agents/skills/kbase-frontend/SKILL.md');
assert.match(skill, /^---\nname: kbase-frontend\ndescription: "[^\n]+"\n---\n/);
assert.ok(skill.split('\n').length < 500);
assert.match(await read('.agents/rules/workspace-boundary.md'), /^---\ntrigger: always_on\n/);

const ignored = new Set(['.git', 'node_modules', 'dist', '.cache', 'coverage', 'test-results', 'playwright-report']);
async function markdownFiles(dir) {
  const found = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(item.name)) continue;
    const p = resolve(dir, item.name);
    if (item.isDirectory()) found.push(...await markdownFiles(p));
    else if (item.isFile() && p.endsWith('.md')) found.push(p);
  }
  return found;
}
let linksChecked = 0;
for (const file of await markdownFiles(root)) {
  if (relative(root, file).startsWith(`docs${sep}references${sep}backend${sep}`)) continue;
  const content = (await readFile(file, 'utf8')).replace(/```[\s\S]*?```/g, '');
  for (const link of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = link[1];
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    const local = decodeURIComponent(target.split('#')[0]);
    const destination = resolve(dirname(file), local);
    const rel = relative(root, destination);
    assert.ok(rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel), `Link escapes root: ${target}`);
    assert.ok((await stat(destination)).isFile(), `Missing link: ${file} -> ${target}`);
    linksChecked++;
  }
}
console.log(JSON.stringify({ status: 'PASS', templates: ids.length, apiOperations: operationSet.size,
  apiPaths: 38, pinnedSnapshots: registry.snapshots.length, localLinksChecked: linksChecked,
  note: 'Harness validation only; no FE application or live backend tests executed.' }, null, 2));

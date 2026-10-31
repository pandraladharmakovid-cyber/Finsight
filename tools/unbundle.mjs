#!/usr/bin/env node
/**
 * FinSight project restorer.
 *
 * Reads a single-text-file bundle and writes every file back to its real
 * location — safely.
 *
 *   node tools/unbundle.mjs finsight-full-project.txt
 *   node tools/unbundle.mjs finsight-full-project.txt --out ./restored
 *   node tools/unbundle.mjs finsight-full-project.txt --force
 *   node tools/unbundle.mjs finsight-full-project.txt --dry-run
 *
 * Safety guarantees
 *  - refuses paths that escape the target directory (no ../ traversal)
 *  - refuses absolute paths
 *  - previews with --dry-run
 *  - backs up files it is about to overwrite (*.bak-<timestamp>)
 *  - never deletes anything that is not in the bundle
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from 'node:fs';
import { join, resolve, dirname, normalize, isAbsolute, sep } from 'node:path';

const args = process.argv.slice(2);

const bundlePath = args.find((arg) => !arg.startsWith('--'));

if (!bundlePath) {
  console.error(
    '\n  Usage: node tools/unbundle.mjs <bundle.txt> [--out DIR] [--force] [--dry-run]\n',
  );
  process.exit(1);
}

const outIndex = args.indexOf('--out');
const OUT_ROOT = resolve(
  outIndex !== -1 && args[outIndex + 1] ? args[outIndex + 1] : process.cwd(),
);

const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');

const raw = readFileSync(resolve(bundlePath), 'utf8');
const lines = raw.split('\n');

const HEADER = /^=+$/;
const FILE_LINE = /^FILE:\s*(.+?)\s*$/;

/* --------------------------------------------------------------------------
   Parse the bundle
   -------------------------------------------------------------------------- */

const entries = [];

for (let i = 0; i < lines.length; i += 1) {
  const match = FILE_LINE.exec(lines[i]);
  if (!match) continue;

  const filePath = match[1];

  // Content begins after the closing separator line following "FILE:"
  let start = i + 1;
  if (HEADER.test(lines[start] ?? '')) start += 1;

  // Find the next FILE header, then trim the separator that belongs to it
  let end = lines.length;
  for (let j = start; j < lines.length; j += 1) {
    if (FILE_LINE.test(lines[j])) {
      end = j;
      break;
    }
  }

  let body = lines.slice(start, end);

  // Drop the trailing separator block that introduces the next file
  while (body.length && body[body.length - 1].trim() === '') body.pop();
  if (body.length && HEADER.test(body[body.length - 1])) {
    body.pop();
    while (body.length && body[body.length - 1].trim() === '') body.pop();
  }

  entries.push({
    path: filePath,
    content: body.join('\n') + '\n',
  });
}

if (entries.length === 0) {
  console.error('\n  No "FILE:" sections found — is this the right bundle?\n');
  process.exit(1);
}

/* --------------------------------------------------------------------------
   Validate every path before writing anything
   -------------------------------------------------------------------------- */

const problems = [];

for (const entry of entries) {
  // Strip only "./" or leading slashes — never a leading dot (".env").
  const clean = entry.path.replace(/^(\.\/|\/)+/, '').replace(/^\.\/+/g, '');

  if (isAbsolute(entry.path) || /^[A-Za-z]:/.test(entry.path)) {
    problems.push(`absolute path: ${entry.path}`);
    continue;
  }

  const target = normalize(join(OUT_ROOT, clean));

  if (target !== OUT_ROOT && !target.startsWith(OUT_ROOT + sep)) {
    problems.push(`escapes target directory: ${entry.path}`);
    continue;
  }

  entry.target = target;
  entry.rel = clean;
}

if (problems.length) {
  console.error('\n  Refusing to restore — unsafe paths detected:\n');
  problems.forEach((problem) => console.error(`    ✗ ${problem}`));
  console.error('');
  process.exit(1);
}

/* --------------------------------------------------------------------------
   Write
   -------------------------------------------------------------------------- */

const stamp = new Date().toISOString().replace(/[:.]/g, '-');

let created = 0;
let overwritten = 0;
let unchanged = 0;
let backedUp = 0;

console.log(`\n  Restoring ${entries.length} files`);
console.log(`  Target: ${OUT_ROOT}`);
console.log(`  Mode:   ${DRY_RUN ? 'dry run (nothing written)' : FORCE ? 'force' : 'safe'}\n`);

for (const entry of entries) {
  const exists = existsSync(entry.target);

  if (exists) {
    const current = readFileSync(entry.target, 'utf8');

    if (current === entry.content) {
      unchanged += 1;
      console.log(`    = ${entry.rel} (identical, skipped)`);
      continue;
    }

    if (!FORCE && !DRY_RUN) {
      // Preserve the user's existing file before replacing it
      const backup = `${entry.target}.bak-${stamp}`;
      copyFileSync(entry.target, backup);
      backedUp += 1;
    }

    overwritten += 1;
    console.log(`    ~ ${entry.rel}${DRY_RUN ? '' : ' (backed up, then replaced)'}`);
  } else {
    created += 1;
    console.log(`    + ${entry.rel}`);
  }

  if (DRY_RUN) continue;

  mkdirSync(dirname(entry.target), { recursive: true });
  writeFileSync(entry.target, entry.content, 'utf8');
}

console.log('\n  ────────────────────────────────────────');
console.log(`  created      ${created}`);
console.log(`  updated      ${overwritten}`);
console.log(`  unchanged    ${unchanged}`);
console.log(`  backups made ${backedUp}`);
console.log('  ────────────────────────────────────────\n');

if (DRY_RUN) {
  console.log('  Dry run complete — re-run without --dry-run to apply.\n');
} else {
  console.log('  Done. Next steps:');
  console.log('    npm install');
  console.log('    cd backend && npm install && cd ..');
  console.log('    npm run api      # API on :5000');
  console.log('    npm run dev      # UI on :3000\n');
}

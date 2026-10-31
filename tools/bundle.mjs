#!/usr/bin/env node
/**
 * FinSight project bundler.
 *
 * Packs every source file into ONE plain-text file using the exact format
 * the restore script expects:
 *
 *     =========================================
 *     FILE: path/to/file.ext
 *     =========================================
 *     <verbatim file content>
 *
 * Usage:
 *   node tools/bundle.mjs                     # -> finsight-full-project.txt
 *   node tools/bundle.mjs out/my-bundle.txt
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Argument parsing — flags must never be mistaken for the output path.
 *   node tools/bundle.mjs [output.txt] [--with-env]
 */
const cliArgs = process.argv.slice(2);
const flags = new Set(cliArgs.filter((arg) => arg.startsWith('--')));
const positional = cliArgs.filter((arg) => !arg.startsWith('--'));

const OUT = resolve(ROOT, positional[0] || 'finsight-full-project.txt');

/** Directories that must never be bundled. */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vite',
  'coverage',
  'build',
  'out',
  'screenshots',
  '.cache',
  'target',
  '__pycache__',
  '.venv',
]);

/** Files that must never be bundled (secrets / lock noise / binaries). */
const SKIP_FILES = new Set([
  'package-lock.json',
  '.DS_Store',
]);

/**
 * Credential files are excluded by default for safety.
 * Pass --with-env to include them (needed if you want a fully
 * self-contained restore that keeps the database credentials).
 */
const WITH_ENV = flags.has('--with-env');

const ENV_FILES = new Set(['.env', '.env.local', '.env.production']);

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx',
  '.css', '.scss', '.html', '.json', '.md', '.txt',
  '.yml', '.yaml', '.svg', '.sql',
]);

function shouldInclude(filePath) {
  const name = filePath.split(sep).pop();

  if (SKIP_FILES.has(name)) return false;

  /* Never bundle the bundle itself (or any previous bundle). */
  if (resolve(filePath) === OUT) return false;
  if (/-full-project\.txt$/i.test(name)) return false;

  // .env.example is always safe; real .env files only with --with-env
  if (name.endsWith('.example')) return true;

  if (ENV_FILES.has(name) || name.startsWith('.env')) {
    return WITH_ENV;
  }

  // Dotfiles like .gitignore have no real extension.
  if (['.gitignore', '.npmrc', '.nvmrc', '.editorconfig'].includes(name)) {
    return true;
  }

  const dotIndex = name.lastIndexOf('.');

  // Extension-less files: only allow well-known project files.
  if (dotIndex === -1) {
    return ['Dockerfile', 'Procfile', 'LICENSE', 'Makefile'].includes(name);
  }

  return TEXT_EXTENSIONS.has(name.slice(dotIndex).toLowerCase());
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(entry)) continue;

    const full = join(dir, entry);
    const stats = statSync(full);

    if (stats.isDirectory()) {
      walk(full, files);
    } else if (stats.isFile() && shouldInclude(full)) {
      files.push(full);
    }
  }

  return files;
}

const files = walk(ROOT);

/* Keep related files grouped in a predictable order. */
const ORDER = [
  'package.json',
  'vite.config.js',
  'index.html',
  '.env.example',
  'README.md',
  'src/',
  'backend/',
  'tests/',
  'tools/',
];

function rank(file) {
  const rel = relative(ROOT, file).split(sep).join('/');

  const index = ORDER.findIndex((prefix) =>
    prefix.endsWith('/') ? rel.startsWith(prefix) : rel === prefix,
  );

  return [index === -1 ? ORDER.length : index, rel];
}

files.sort((a, b) => {
  const [ra, na] = rank(a);
  const [rb, nb] = rank(b);
  return ra - rb || na.localeCompare(nb);
});

const SEPARATOR = '='.repeat(41);

let output = `# FinSight v2.0 — complete project source
#
# Generated: ${new Date().toISOString()}
# Files: ${files.length}
#
# Restore with:  node tools/unbundle.mjs finsight-full-project.txt
#
`;

const manifest = [];

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const content = readFileSync(file, 'utf8');

  output += `\n${SEPARATOR}\nFILE: ${rel}\n${SEPARATOR}\n${content}`;

  if (!content.endsWith('\n')) output += '\n';

  manifest.push(rel);
}

writeFileSync(OUT, output, 'utf8');

const bytes = Buffer.byteLength(output, 'utf8');
const lines = output.split('\n').length;

console.log(`\n  Bundled ${manifest.length} files`);
console.log(`  → ${relative(process.cwd(), OUT) || OUT}`);
console.log(`  ${(bytes / 1024).toFixed(1)} kB · ${lines.toLocaleString()} lines`);
console.log(
  `  env files: ${WITH_ENV ? 'INCLUDED (--with-env)' : 'excluded (safe default)'}\n`,
);

for (const file of manifest) {
  console.log(`    ${file}`);
}

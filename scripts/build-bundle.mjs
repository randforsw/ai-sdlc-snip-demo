#!/usr/bin/env node
// scripts/build-bundle.mjs
//
// Assembles the "bundle" branch: a self-contained Bun/Docker deployable that
// combines the backend server, CLI, and the built Angular frontend.
//
// Usage:
//   node scripts/build-bundle.mjs           # assemble locally, no push
//   node scripts/build-bundle.mjs --push    # assemble + git push bundle + main
//
// Zero npm dependencies — uses only Node.js built-ins (Node >= 18 required).

import { spawnSync }                                                  from 'child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync,
         writeFileSync }                                              from 'fs';
import { join, resolve }                                              from 'path';
import { fileURLToPath }                                              from 'url';

/* ── config ─────────────────────────────────────────────────────────────── */

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const PUSH = process.argv.includes('--push');

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Run a shell command (npm, npx, etc.) — cross-platform via shell:true. */
function sh(cmd, cwd = ROOT) {
  console.log(`  $ ${cmd}`);
  const r = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit' });
  if (r.status !== 0) {
    process.stderr.write(`\nFATAL: "${cmd}" exited ${r.status}\n`);
    process.exit(r.status ?? 1);
  }
}

/** Run a git command with an explicit args array (avoids shell-quoting issues). */
function git(args, cwd = ROOT) {
  const r = spawnSync('git', args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    process.stderr.write(`\nFATAL: git ${args.join(' ')} exited ${r.status}\n`);
    process.exit(r.status ?? 1);
  }
}

/** Capture stdout from a git command. */
function gitOut(args, cwd = ROOT) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' }).stdout.trim();
}

/** Returns true if there are staged (index) changes ready to commit. */
function hasStagedChanges(cwd) {
  return gitOut(['diff', '--cached', '--name-only'], cwd).length > 0;
}

/* ── 1. Update backend / frontend / cli to their branch tips ─────────────── */

console.log('\n════ 1/5  Updating submodules (backend, frontend, cli) ════');
git(['submodule', 'update', '--init', '--remote', 'backend', 'frontend', 'cli']);

/* ── 2. Build frontend ───────────────────────────────────────────────────── */

const frontendDir = join(ROOT, 'frontend');
const distBrowser = join(frontendDir, 'dist', 'snip-frontend', 'browser');
const indexHtml   = join(distBrowser, 'index.html');

console.log('\n════ 2/5  Building frontend ════');
sh('npm install', frontendDir);
sh('npx ng build', frontendDir);

if (!existsSync(indexHtml)) {
  process.stderr.write(
    `\nFATAL: expected build output not found:\n  ${indexHtml}\n` +
    'ng build may have silently failed.\n',
  );
  process.exit(1);
}
console.log('\n  ✓ Build output verified');

/* ── 3. Assemble bundle/ ─────────────────────────────────────────────────── */

const bundleDir = join(ROOT, 'bundle');
const publicDir = join(bundleDir, 'public');

console.log('\n════ 3/5  Assembling bundle/ ════');

// server.js and cli.js — verbatim copies
copyFileSync(join(ROOT, 'backend', 'server.js'), join(bundleDir, 'server.js'));
copyFileSync(join(ROOT, 'cli',     'cli.js'),    join(bundleDir, 'cli.js'));

// public/ — replace entirely so stale hashed filenames don't accumulate
if (existsSync(publicDir)) rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(distBrowser, publicDir, { recursive: true });

// .env — Bun auto-loads this; PUBLIC_DIR tells the server to serve static files
writeFileSync(join(bundleDir, '.env'), 'PUBLIC_DIR=./public\n');

// package.json — "start" script for Railway/Docker; NO "type" field so
// cli.js (CommonJS) still runs under plain `node cli.js`
writeFileSync(
  join(bundleDir, 'package.json'),
  JSON.stringify(
    { name: 'snip', version: '1.0.0', scripts: { start: 'bun server.js' } },
    null, 2,
  ) + '\n',
);

// Dockerfile
writeFileSync(join(bundleDir, 'Dockerfile'), [
  'FROM oven/bun:1-alpine',
  'WORKDIR /app',
  'COPY . .',
  'ENV PORT=3000',
  'EXPOSE 3000',
  'CMD bun server.js',
  '',
].join('\n'));

// .dockerignore
writeFileSync(join(bundleDir, '.dockerignore'), [
  'node_modules',
  '*.md',
  '',
].join('\n'));

// railway.json — select the Dockerfile builder
writeFileSync(
  join(bundleDir, 'railway.json'),
  JSON.stringify({
    $schema: 'https://railway.app/railway.schema.json',
    build:   { builder: 'DOCKERFILE' },
    deploy:  { restartPolicyType: 'ON_FAILURE', restartPolicyMaxRetries: 10 },
  }, null, 2) + '\n',
);

console.log('  ✓ Files written to bundle/');

/* ── 4. Commit inside bundle/ ────────────────────────────────────────────── */

const bSHA = gitOut(['rev-parse', '--short', 'HEAD'], join(ROOT, 'backend'));
const fSHA = gitOut(['rev-parse', '--short', 'HEAD'], join(ROOT, 'frontend'));
const cSHA = gitOut(['rev-parse', '--short', 'HEAD'], join(ROOT, 'cli'));
const msg  = `chore: bundle backend@${bSHA} frontend@${fSHA} cli@${cSHA}`;

console.log('\n════ 4/5  Committing bundle/ ════');
git(['add', '-A'], bundleDir);

if (hasStagedChanges(bundleDir)) {
  git(['commit', '-m', msg], bundleDir);
} else {
  console.log('  Nothing to commit in bundle/ — already up to date.');
}
if (PUSH) git(['push', 'origin', 'HEAD:bundle'], bundleDir);

/* ── 5. Bump superproject submodule pointers ─────────────────────────────── */

console.log('\n════ 5/5  Bumping superproject pointers ════');
git(['add', 'backend', 'frontend', 'cli', 'bundle']);

if (hasStagedChanges(ROOT)) {
  git(['commit', '-m', 'chore: bump submodule pointers']);
} else {
  console.log('  Nothing to commit in superproject — already up to date.');
}
if (PUSH) git(['push', 'origin', 'main']);

console.log('\n✓ All done.\n');

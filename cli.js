#!/usr/bin/env node
'use strict';

const https         = require('https');
const http          = require('http');
const { spawn }     = require('child_process');

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/$/, '');
const [,, cmd, arg] = process.argv;

/* ── error helper ─────────────────────────────────────────────────────────── */

function die(msg) {
  process.stderr.write('snip: ' + msg + '\n');
  process.exit(1);
}

/* ── http helpers ─────────────────────────────────────────────────────────── */

/** Wrapper around global fetch for JSON API calls */
async function api(path, method, body) {
  const url  = BASE + path;
  const init = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = JSON.stringify(body);

  let res;
  try { res = await fetch(url, init); }
  catch (e) { die('cannot reach backend — ' + e.message); }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    die('server error ' + res.status + (text ? ': ' + text.trim() : ''));
  }
  return res.json();
}

/**
 * GET /:code without following the redirect.
 * Uses http/https directly because the global fetch opaque-redirect response
 * does not expose the Location header.
 */
function peekRedirect(code) {
  return new Promise((resolve, reject) => {
    const url = BASE + '/' + code;
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, (res) => {
      res.resume(); // discard body
      if (res.statusCode >= 300 && res.statusCode < 400) {
        resolve(res.headers.location || null);
      } else {
        resolve(null);
      }
    });
    req.on('error', reject);
  });
}

/* ── commands ─────────────────────────────────────────────────────────────── */

async function add(url) {
  if (!url) die('add requires a <url> argument');
  const link = await api('/api/links', 'POST', { url });
  console.log(link.shortUrl);
}

async function ls() {
  const links = await api('/api/links');
  if (!links.length) { console.log('No links yet.'); return; }

  const cW = Math.max(4, ...links.map(function(l) { return l.code.length; }));
  const hW = Math.max(4, ...links.map(function(l) { return String(l.hits).length; }));

  console.log('Code'.padEnd(cW) + '  ' + 'Hits'.padStart(hW) + '  URL');
  console.log('-'.repeat(cW)    + '  ' + '-'.repeat(hW)       + '  ' + '-'.repeat(40));
  links.forEach(function(l) {
    console.log(l.code.padEnd(cW) + '  ' + String(l.hits).padStart(hW) + '  ' + l.url);
  });
}

async function openCmd(code) {
  if (!code) die('open requires a <code> argument');

  let location;
  try { location = await peekRedirect(code); }
  catch (e) { die('cannot reach backend — ' + e.message); }
  if (!location) die("unknown code '" + code + "'");

  var p    = process.platform;
  var bin  = p === 'win32'  ? 'cmd'      : p === 'darwin' ? 'open'     : 'xdg-open';
  var args = p === 'win32'  ? ['/c', 'start', '', location]
           : p === 'darwin' ? [location]
           :                  [location];

  spawn(bin, args, { detached: true, stdio: 'ignore' }).unref();
  console.log('Opening ' + location);
}

function usage() {
  process.stdout.write([
    'Usage:',
    '  snip add <url>    Shorten a URL and print the short link',
    '  snip ls           List all short links',
    '  snip open <code>  Open a short link in the OS default browser',
    '  snip help         Show this help',
    '',
    'Environment:',
    '  SNIP_API   Backend base URL (default: http://localhost:3000)',
    '',
  ].join('\n'));
}

/* ── dispatch ─────────────────────────────────────────────────────────────── */

(async function() {
  switch (cmd) {
    case 'add':  await add(arg);     break;
    case 'ls':   await ls();         break;
    case 'open': await openCmd(arg); break;
    case 'help':
    case undefined: usage();         break;
    default: die("unknown command '" + cmd + "' — run \"snip help\" for usage");
  }
}()).catch(function(e) { die(e.message); });

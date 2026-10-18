#!/usr/bin/env node
/**
 * Fetch Keys/Controls sections from GitHub READMEs for catalog items.
 *
 * Usage: node scripts/fetch-catalog-keys.mjs
 * Writes: catalog-keys.js
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "catalog-keys.js");
const HEADING = /^(#{1,4}\s*)?(keys|controls|keyboard|game controls|buttons)\b[:\s]*$/i;
const STOP = /^#{1,4}\s+\S/;

function capitalize(s) {
  const t = clean(s);
  if (!t) return t;
  return t[0].toUpperCase() + t.slice(1);
}

function clean(s) {
  return String(s || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/[🕹️🅰️🅱️▶️⬅️⬆️⬇️🔴🟢]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseGithubRepo(url) {
  const m = String(url || "").match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

function extractObjectAfter(source, startIdx) {
  const open = source.indexOf("{", startIdx);
  if (open < 0) return null;
  let depth = 0;
  let inStr = false;
  let quote = "";
  let esc = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
}

function extractEntries(source) {
  const entries = [];
  const idRe = /\bid:\s*"([^"]+)"/g;
  let match;
  while ((match = idRe.exec(source))) {
    // Walk back to the nearest `{` that starts this object
    let start = match.index;
    while (start > 0 && source[start] !== "{") start--;
    if (source[start] !== "{") continue;
    const obj = extractObjectAfter(source, start);
    if (!obj) continue;
    // Prefer the id declared near the start of the object
    const id = obj.match(/^\{\s*id:\s*"([^"]+)"/)?.[1] || match[1];
    const repo = obj.match(/repo:\s*"(https:\/\/github\.com\/[^"]+)"/)?.[1];
    if (id && repo) entries.push({ id, repo });
  }
  return entries;
}

function loadCatalogEntries() {
  const files = ["index.html", "catalog-extra.js"].map((f) =>
    readFileSync(join(ROOT, f), "utf8")
  );
  const byId = new Map();
  for (const src of files) {
    for (const e of extractEntries(src)) byId.set(e.id, e);
  }
  return [...byId.values()];
}

async function fetchReadme(owner, repo) {
  const branches = ["main", "master"];
  const names = ["README.md", "readme.md", "Readme.md"];
  for (const branch of branches) {
    for (const name of names) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${name}`;
      const res = await fetch(url);
      if (res.ok) return { text: await res.text(), url };
    }
  }
  return null;
}

function sectionBody(md) {
  const lines = md.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim().replace(/\*+/g, "");
    if (HEADING.test(trimmed)) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;
  const out = [];
  for (let i = start; i < lines.length; i++) {
    if (STOP.test(lines[i].trim()) && !HEADING.test(lines[i].trim().replace(/\*+/g, ""))) break;
    out.push(lines[i]);
  }
  return out.join("\n");
}

function looksLikeKeyToken(s) {
  const t = clean(s);
  if (!t || t.length > 24) return false;
  if (/^[\[\]{}+\-.,;:/\\'"0-9]+$/i.test(t)) return true;
  if (/^(fn|opt|ctrl|alt|del|esc|tab|enter|space|shift|go|[a-z]|f\d{1,2}|1-7)$/i.test(t)) return true;
  if (/\+|arrow|\//i.test(t) && t.length <= 16) return true;
  return false;
}

function looksLikeLabel(s) {
  const t = clean(s);
  if (/^(up|down|left|right|pause|fire|use|map|forward|backward|weapon|confirm|navigate|menu)$/i.test(t)) {
    return true;
  }
  return t.length > 2 && /[a-z]{3,}/i.test(t) && !looksLikeKeyToken(t);
}

function normalizePair(a, b) {
  let key = clean(a).replace(/^["']|["']$/g, "");
  let action = clean(b).replace(/^["']|["']$/g, "");
  if (!key || !action) return null;
  if (key === "-" && action === "-") return null;
  if (/^-{3,}$/.test(key) || /^-{3,}$/.test(action)) return null;
  if (/\/$/.test(key) || /^(src|assets|docs|tools|lib|bin)\b/i.test(key)) return null;
  if (/^(keys?|button|action|function|description|some mini)$/i.test(key)) return null;
  if (/^(keys?|button|action|function|description)$/i.test(action)) return null;
  if (/may use alternate|are hotkeys for/i.test(action)) return null;
  // "left: ," or "Forward: ;" → key token on the right
  if (looksLikeLabel(key) && looksLikeKeyToken(action)) {
    return [action, capitalize(key)];
  }
  return [key, capitalize(action)];
}

function parseBullet(line) {
  let t = line.trim();
  t = t.replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "");
  if (!t || t.startsWith("|") || t.startsWith("```") || t.startsWith("<")) return null;

  // "ENTER key To Pause the Game" / "] or [ key to set screen brightness"
  let m = t.match(/^(.+?)\s+keys?\s+to\s+(.+)$/i);
  if (m) return normalizePair(m[1], m[2]);

  // left: ","   or   pause - "p"
  m = t.match(/^(.+?)\s*[-–—:]\s*(.+)$/);
  if (m) return normalizePair(m[1], m[2]);
  return null;
}

function parseTable(body) {
  const rows = [];
  for (const line of body.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    if (/^\|?\s*-{2,}/.test(line.trim())) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    // Skip header-ish rows
    if (/^(nes )?function|key|button|description$/i.test(cells[0])) continue;
    const pair = normalizePair(cells[1] || "", cells[2] || cells[0] || "");
    if (pair) rows.push(pair);
  }
  return rows;
}

function looksLikeKeymap(rows) {
  if (rows.length < 2 || rows.length > 18) return false;
  const shortKeys = rows.filter(([k]) => k.length <= 32).length;
  // Reject changelog-sized "controls" dumps
  const avgAction = rows.reduce((n, [, a]) => n + a.length, 0) / rows.length;
  return shortKeys >= Math.ceil(rows.length * 0.6) && avgAction < 140;
}

function parseRows(body) {
  if (!body) return [];
  const table = parseTable(body);
  if (looksLikeKeymap(table)) return dedupe(table);

  const rows = [];
  for (const line of body.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = parseBullet(line);
    if (row) rows.push(row);
  }
  const list = dedupe(rows);
  return looksLikeKeymap(list) ? list : [];
}

function dedupe(rows) {
  const seen = new Set();
  const out = [];
  for (const [k, a] of rows) {
    const id = k.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push([k, a]);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const entries = loadCatalogEntries();
  const byRepo = new Map();
  for (const e of entries) {
    const g = parseGithubRepo(e.repo);
    if (!g) continue;
    const key = `${g.owner}/${g.repo}`.toLowerCase();
    if (!byRepo.has(key)) byRepo.set(key, { owner: g.owner, name: g.repo, ids: [] });
    byRepo.get(key).ids.push(e.id);
  }

  console.log(`Catalog items with GitHub repos: ${entries.length}`);
  console.log(`Unique repos to fetch: ${byRepo.size}`);

  const keys = {};
  const report = { ok: [], miss: [], fail: [] };

  let i = 0;
  for (const [, info] of byRepo) {
    i++;
    const label = `${info.owner}/${info.name}`;
    process.stdout.write(`[${i}/${byRepo.size}] ${label} … `);
    try {
      const readme = await fetchReadme(info.owner, info.name);
      if (!readme) {
        console.log("no README");
        report.miss.push(label);
        await sleep(80);
        continue;
      }
      const rows = parseRows(sectionBody(readme.text));
      if (rows.length < 2) {
        console.log("no Keys/Controls section");
        report.miss.push(label);
      } else {
        console.log(`${rows.length} bindings → ${info.ids.join(", ")}`);
        const payload = { rows, source: readme.url };
        for (const id of info.ids) keys[id] = payload;
        report.ok.push(label);
      }
    } catch (err) {
      console.log(`error: ${err.message}`);
      report.fail.push(label);
    }
    await sleep(80);
  }

  const sorted = Object.fromEntries(
    Object.entries(keys).sort(([a], [b]) => a.localeCompare(b))
  );
  const file = `// Auto-generated by scripts/fetch-catalog-keys.mjs — do not edit by hand.
// Re-run: node scripts/fetch-catalog-keys.mjs

export const KEYS = ${JSON.stringify(sorted, null, 2)};
`;
  writeFileSync(OUT, file);
  console.log(`\nWrote ${Object.keys(sorted).length} entries → catalog-keys.js`);
  console.log(`OK: ${report.ok.length}  miss: ${report.miss.length}  fail: ${report.fail.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

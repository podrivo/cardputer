#!/usr/bin/env node
/**
 * Export installer id → { emoji, name, desc } for Open Graph edge injection.
 *
 * Usage: node scripts/export-catalog-meta.mjs
 * Writes: catalog-meta.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "catalog-meta.json");

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

function field(obj, key) {
  const m = obj.match(new RegExp(`\\b${key}:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  return m ? m[1].replace(/\\(.)/g, "$1") : "";
}

function extractEntries(source) {
  const entries = [];
  const idRe = /\bid:\s*"([^"]+)"/g;
  let match;
  while ((match = idRe.exec(source))) {
    let start = match.index;
    while (start > 0 && source[start] !== "{") start--;
    if (source[start] !== "{") continue;
    const obj = extractObjectAfter(source, start);
    if (!obj) continue;
    const id = obj.match(/^\{\s*id:\s*"([^"]+)"/)?.[1] || match[1];
    const name = field(obj, "name");
    const desc = field(obj, "desc");
    if (!id || !name || !desc) continue;
    entries.push({
      id,
      emoji: field(obj, "emoji") || "📦",
      name,
      desc,
    });
  }
  return entries;
}

function loadCatalogMeta() {
  const files = ["index.html", "catalog-extra.js"].map((f) =>
    readFileSync(join(ROOT, f), "utf8")
  );
  const byId = {};
  for (const src of files) {
    for (const e of extractEntries(src)) {
      byId[e.id] = { emoji: e.emoji, name: e.name, desc: e.desc };
    }
  }
  return byId;
}

const meta = loadCatalogMeta();
const ids = Object.keys(meta).sort();
writeFileSync(OUT, `${JSON.stringify(meta, null, 2)}\n`);
console.log(`Wrote ${ids.length} installers → catalog-meta.json`);

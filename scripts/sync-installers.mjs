#!/usr/bin/env node
/**
 * Sync catalog firmware bins from upstream GitHub Releases.
 *
 * Usage:
 *   node scripts/sync-installers.mjs              # apply updates
 *   node scripts/sync-installers.mjs --dry-run    # report only
 *   node scripts/sync-installers.mjs --bootstrap  # refresh lock from local sizes
 *
 * Writes/reads: scripts/installer-sync-lock.json
 * Updates: bins/*, index.html, catalog-extra.js
 */
import { createHash } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  unlinkSync,
  mkdirSync,
} from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCK_PATH = join(ROOT, "scripts", "installer-sync-lock.json");
const CATALOG_FILES = ["index.html", "catalog-extra.js"];
const dryRun = process.argv.includes("--dry-run");
const bootstrapOnly = process.argv.includes("--bootstrap");

function ghApi(path) {
  const out = execFileSync("gh", ["api", path], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out);
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
    let start = match.index;
    while (start > 0 && source[start] !== "{") start--;
    if (source[start] !== "{") continue;
    const obj = extractObjectAfter(source, start);
    if (!obj) continue;
    const id = obj.match(/^\{\s*id:\s*"([^"]+)"/)?.[1] || match[1];
    const repo = obj.match(/repo:\s*"(https:\/\/github\.com\/[^"]+)"/)?.[1];
    const files = [];
    for (const m of obj.matchAll(/bin\("([^"]+)"\)/g)) files.push(`bins/${m[1]}`);
    for (const m of obj.matchAll(/file:\s*"(bins\/[^"]+\.bin)"/g)) {
      files.push(m[1]);
    }
    if (id && repo) entries.push({ id, repo, files: [...new Set(files)] });
  }
  return entries;
}

function loadCatalogEntries() {
  const byId = new Map();
  for (const f of CATALOG_FILES) {
    const src = readFileSync(join(ROOT, f), "utf8");
    for (const e of extractEntries(src)) byId.set(e.id, e);
  }
  return [...byId.values()];
}

function parseGithubRepo(url) {
  const m = String(url || "").match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i
  );
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

/** Collapse version tokens so hazke-v1.4.0-cardputer ≈ hazke-v1.5.0-cardputer */
function assetKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\.bin$/i, "")
    // Require at least N.M so "m5stack" / "c3" are kept
    .replace(/v?\d+(?:[._-]\d+){1,4}[a-z]*/gi, "#")
    .replace(/#+/g, "#")
    .replace(/^#|#$/g, "")
    .replace(/[^a-z0-9#]+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTag(tag) {
  return String(tag || "")
    .replace(/^v/i, "")
    .trim();
}

function sha256File(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function loadLock() {
  if (!existsSync(LOCK_PATH)) return { version: 1, installers: {} };
  return JSON.parse(readFileSync(LOCK_PATH, "utf8"));
}

function saveLock(lock) {
  const ordered = {
    version: 1,
    installers: Object.fromEntries(
      Object.entries(lock.installers || {}).sort(([a], [b]) =>
        a.localeCompare(b)
      )
    ),
  };
  writeFileSync(LOCK_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
}

function fetchReleases(owner, repo, { history = false } = {}) {
  if (!history) {
    try {
      const latest = ghApi(`repos/${owner}/${repo}/releases/latest`);
      if (latest?.tag_name) return [latest];
    } catch {
      /* fall through to list */
    }
  }
  try {
    const list = ghApi(`repos/${owner}/${repo}/releases?per_page=15`);
    if (Array.isArray(list) && list.length) return list;
  } catch {
    /* no releases */
  }
  return [];
}

function binAssets(release) {
  return (release.assets || []).filter((a) => /\.bin$/i.test(a.name));
}

function findBySize(releases, size) {
  for (const rel of releases) {
    const hits = binAssets(rel).filter((a) => a.size === size);
    if (hits.length === 1) {
      return { release: rel, asset: hits[0] };
    }
    if (hits.length > 1) {
      // Prefer cardputer / adv / merged when sizes collide
      const ranked = [...hits].sort(
        (a, b) => scoreName(b.name) - scoreName(a.name)
      );
      return { release: rel, asset: ranked[0] };
    }
  }
  return null;
}

function scoreName(name) {
  const n = name.toLowerCase();
  let s = 0;
  if (n.includes("cardputer-adv") || n.includes("cardputer_adv")) s += 100;
  else if (n.includes("cardputer")) s += 60;
  if (n.includes("-adv") || n.includes("_adv") || n.includes(".adv")) s += 30;
  if (n.includes("merged") || n.includes("m5burner") || n.includes("factory"))
    s += 15;
  if (n.includes("launcher") || n.includes("bootloader") || n.includes("partition"))
    s -= 40;
  if (n.includes("-app.bin") || n.endsWith("app.bin")) s -= 20;
  return s;
}

function resolveAsset(release, lockedAssetName) {
  const assets = binAssets(release);
  if (!assets.length) return null;
  const exact = assets.find((a) => a.name === lockedAssetName);
  if (exact) return exact;
  const key = assetKey(lockedAssetName);
  const keyed = assets.filter((a) => assetKey(a.name) === key);
  if (keyed.length === 1) return keyed[0];
  if (keyed.length > 1) {
    return [...keyed].sort((a, b) => scoreName(b.name) - scoreName(a.name))[0];
  }
  return null;
}

function nextLocalName(oldFile, newTag, id) {
  const base = basename(oldFile, ".bin");
  const tag = normalizeTag(newTag);
  if (!tag) return oldFile.startsWith("bins/") ? oldFile : `bins/${oldFile}`;

  const replaced = base.replace(
    /v?\d+(?:[._-]\d+){1,3}[a-z0-9.-]*/i,
    (m) => (m[0] === "v" || m[0] === "V" ? `v${tag}` : tag)
  );
  if (replaced !== base) return `bins/${replaced}.bin`;
  return `bins/${id}-v${tag}.bin`;
}

function replaceCatalogPath(oldPath, newPath) {
  const oldBin = oldPath.replace(/^bins\//, "");
  const newBin = newPath.replace(/^bins\//, "");
  let changed = 0;
  for (const f of CATALOG_FILES) {
    const path = join(ROOT, f);
    let src = readFileSync(path, "utf8");
    const before = src;
    src = src.split(`bin("${oldBin}")`).join(`bin("${newBin}")`);
    src = src.split(`"${oldPath}"`).join(`"${newPath}"`);
    if (src !== before) {
      if (!dryRun) writeFileSync(path, src);
      changed++;
    }
  }
  return changed;
}

function downloadAsset(asset, destPath, { owner, repo, tag }) {
  mkdirSync(dirname(destPath), { recursive: true });
  const tmpDir = join(ROOT, ".sync-tmp");
  mkdirSync(tmpDir, { recursive: true });
  const downloaded = join(tmpDir, asset.name);
  try {
    if (existsSync(downloaded)) unlinkSync(downloaded);
    execFileSync(
      "gh",
      [
        "release",
        "download",
        tag,
        "--repo",
        `${owner}/${repo}`,
        "--pattern",
        asset.name,
        "--dir",
        tmpDir,
        "--clobber",
      ],
      { stdio: ["ignore", "inherit", "inherit"], env: process.env }
    );
    const buf = readFileSync(downloaded);
    if (asset.size && buf.length !== asset.size) {
      throw new Error(
        `size mismatch for ${asset.name}: got ${buf.length}, expected ${asset.size}`
      );
    }
    writeFileSync(destPath, buf);
    return createHash("sha256").update(buf).digest("hex");
  } finally {
    try {
      if (existsSync(downloaded)) unlinkSync(downloaded);
    } catch {
      /* ignore */
    }
  }
}

function bootstrapEntry(entry, releases, lock) {
  const file = entry.files[0];
  if (!existsSync(join(ROOT, file))) return null;
  const size = statSync(join(ROOT, file)).size;
  const hit = findBySize(releases, size);
  if (!hit) return null;
  const rec = {
    asset: hit.asset.name,
    assetKey: assetKey(hit.asset.name),
    tag: hit.release.tag_name,
    size: hit.asset.size,
    file,
    sha256: sha256File(join(ROOT, file)),
    repo: `${parseGithubRepo(entry.repo).owner}/${parseGithubRepo(entry.repo).repo}`,
  };
  lock.installers[entry.id] = rec;
  return rec;
}

function main() {
  const lock = loadLock();
  lock.installers ||= {};

  const entries = loadCatalogEntries().filter((e) => e.files.length === 1);
  const updates = [];
  const skipped = [];
  const bootstrapped = [];

  for (const entry of entries) {
    const gh = parseGithubRepo(entry.repo);
    if (!gh) {
      skipped.push({ id: entry.id, reason: "not-github" });
      continue;
    }

    let rec = lock.installers[entry.id];
    if (rec?.disabled && !bootstrapOnly) {
      skipped.push({
        id: entry.id,
        reason: `disabled:${rec.disabledReason || "manual"}`,
      });
      continue;
    }

    const needHistory = !rec || bootstrapOnly || rec.disabled;

    let releases;
    try {
      releases = fetchReleases(gh.owner, gh.repo, { history: needHistory });
    } catch (err) {
      skipped.push({ id: entry.id, reason: `api-error: ${err.message || err}` });
      continue;
    }
    if (!releases.length) {
      skipped.push({ id: entry.id, reason: "no-releases" });
      continue;
    }

    if (!rec || bootstrapOnly || rec.disabled) {
      const built = bootstrapEntry(entry, releases, lock);
      if (!built) {
        skipped.push({ id: entry.id, reason: "no-size-match" });
        continue;
      }
      bootstrapped.push(entry.id);
      rec = built;
      if (bootstrapOnly) continue;
      // Re-fetch latest only for the update check after historical bootstrap
      releases = fetchReleases(gh.owner, gh.repo, { history: false });
      if (!releases.length) {
        skipped.push({ id: entry.id, reason: "no-releases" });
        continue;
      }
    }

    // Keep file path in lock aligned with catalog
    const catalogFile = entry.files[0];
    if (rec.file !== catalogFile) rec.file = catalogFile;

    const latest =
      releases.find((r) => !r.draft && !r.prerelease && binAssets(r).length) ||
      releases.find((r) => !r.draft && binAssets(r).length) ||
      releases[0];

    const asset = resolveAsset(latest, rec.asset);
    if (!asset) {
      lock.installers[entry.id] = {
        ...rec,
        disabled: true,
        disabledReason: `asset-missing:${rec.asset}`,
      };
      skipped.push({
        id: entry.id,
        reason: `asset-missing:${rec.asset}`,
        tag: latest?.tag_name,
      });
      continue;
    }

    const same =
      asset.name === rec.asset &&
      asset.size === rec.size &&
      latest.tag_name === rec.tag;
    if (same) {
      skipped.push({ id: entry.id, reason: "up-to-date", tag: rec.tag });
      continue;
    }

    const newFile = nextLocalName(rec.file, latest.tag_name, entry.id);
    updates.push({
      id: entry.id,
      fromTag: rec.tag,
      toTag: latest.tag_name,
      asset: asset.name,
      oldFile: rec.file,
      newFile,
      size: asset.size,
      url: asset.url,
      browser_download_url: asset.browser_download_url,
    });

    if (dryRun) continue;

    const dest = join(ROOT, newFile);
    const digest = downloadAsset(asset, dest, {
      owner: gh.owner,
      repo: gh.repo,
      tag: latest.tag_name,
    });
    if (rec.file !== newFile && existsSync(join(ROOT, rec.file))) {
      unlinkSync(join(ROOT, rec.file));
    }
    replaceCatalogPath(rec.file, newFile);
    lock.installers[entry.id] = {
      ...rec,
      asset: asset.name,
      assetKey: assetKey(asset.name),
      tag: latest.tag_name,
      size: asset.size,
      file: newFile,
      sha256: digest,
      repo: `${gh.owner}/${gh.repo}`,
      updatedAt: new Date().toISOString(),
    };
  }

  if (!dryRun) saveLock(lock);

  const report = {
    dryRun,
    bootstrapOnly,
    bootstrapped: bootstrapped.length,
    updates: updates.length,
    skipped: skipped.length,
    updated: updates.map((u) => `${u.id}: ${u.fromTag} → ${u.toTag} (${u.asset})`),
    skippedReasons: Object.entries(
      skipped.reduce((acc, s) => {
        const key = s.reason.split(":")[0];
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ),
  };
  console.log(JSON.stringify(report, null, 2));

  if (updates.length) {
    console.log("\nDetails:");
    for (const u of updates) {
      console.log(
        `- ${u.id}: ${u.fromTag} → ${u.toTag}\n  ${u.oldFile} → ${u.newFile}\n  asset: ${u.asset}`
      );
    }
  }

  // Machine-readable for the workflow
  if (process.env.GITHUB_OUTPUT) {
    const summary = updates
      .map((u) => `- ${u.id}: ${u.fromTag} → ${u.toTag}`)
      .join("\n");
    const lines = [
      `updated=${updates.length}`,
      `summary<<EOF`,
      summary || "No installer updates",
      `EOF`,
    ];
    writeFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`, {
      flag: "a",
    });
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

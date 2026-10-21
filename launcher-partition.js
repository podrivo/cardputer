/**
 * Partition-table helpers for Mini Launcher packing (browser).
 * Mirrors cardputer-launcher/scripts/append-partition.mjs
 */

const FLASH_SIZE = 0x800000;
export const TABLE_OFF = 0x8000;
export const TABLE_SIZE = 0xc00;
const ENTRY_SIZE = 32;
const MAGIC = 0x50aa;
const MD5_MAGIC = 0xebeb;
const TYPE_APP = 0x00;
const SUB_FACTORY = 0x00;
const SUB_OTA_0 = 0x10;
const ALIGN = 0x10000;

function readU16(buf, o) {
  return buf[o] | (buf[o + 1] << 8);
}
function readU32(buf, o) {
  return (buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16) | (buf[o + 3] << 24)) >>> 0;
}
function writeU16(buf, o, v) {
  buf[o] = v & 0xff;
  buf[o + 1] = (v >> 8) & 0xff;
}
function writeU32(buf, o, v) {
  buf[o] = v & 0xff;
  buf[o + 1] = (v >> 8) & 0xff;
  buf[o + 2] = (v >> 16) & 0xff;
  buf[o + 3] = (v >>> 24) & 0xff;
}

function alignUp(n, a) {
  return (n + (a - 1)) & ~(a - 1);
}

function labelOf(entry) {
  let end = 12;
  while (end < 28 && entry[end] !== 0) end++;
  return new TextDecoder().decode(entry.subarray(12, end));
}

/** Minimal MD5 (ESP partition table checksum). */
function md5(bytes) {
  // Adapted compact MD5; input is Uint8Array.
  function cmn(q, a, b, x, s, t) {
    a = (a + q + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const len = bytes.length;
  const nBlocks = (((len + 8) >>> 6) + 1) * 16;
  const words = new Array(nBlocks).fill(0);
  for (let i = 0; i < len; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  words[nBlocks - 2] = len * 8;

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let i = 0; i < nBlocks; i += 16) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    const w = words.slice(i, i + 16);

    a = ff(a, b, c, d, w[0], 7, 0xd76aa478);
    d = ff(d, a, b, c, w[1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, w[2], 17, 0x242070db);
    b = ff(b, c, d, a, w[3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, w[4], 7, 0xf57c0faf);
    d = ff(d, a, b, c, w[5], 12, 0x4787c62a);
    c = ff(c, d, a, b, w[6], 17, 0xa8304613);
    b = ff(b, c, d, a, w[7], 22, 0xfd469501);
    a = ff(a, b, c, d, w[8], 7, 0x698098d8);
    d = ff(d, a, b, c, w[9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, w[10], 17, 0xffff5bb1);
    b = ff(b, c, d, a, w[11], 22, 0x895cd7be);
    a = ff(a, b, c, d, w[12], 7, 0x6b901122);
    d = ff(d, a, b, c, w[13], 12, 0xfd987193);
    c = ff(c, d, a, b, w[14], 17, 0xa679438e);
    b = ff(b, c, d, a, w[15], 22, 0x49b40821);

    a = gg(a, b, c, d, w[1], 5, 0xf61e2562);
    d = gg(d, a, b, c, w[6], 9, 0xc040b340);
    c = gg(c, d, a, b, w[11], 14, 0x265e5a51);
    b = gg(b, c, d, a, w[0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, w[5], 5, 0xd62f105d);
    d = gg(d, a, b, c, w[10], 9, 0x02441453);
    c = gg(c, d, a, b, w[15], 14, 0xd8a1e681);
    b = gg(b, c, d, a, w[4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, w[9], 5, 0x21e1cde6);
    d = gg(d, a, b, c, w[14], 9, 0xc33707d6);
    c = gg(c, d, a, b, w[3], 14, 0xf4d50d87);
    b = gg(b, c, d, a, w[8], 20, 0x455a14ed);
    a = gg(a, b, c, d, w[13], 5, 0xa9e3e905);
    d = gg(d, a, b, c, w[2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, w[7], 14, 0x676f02d9);
    b = gg(b, c, d, a, w[12], 20, 0x8d2a4c8a);

    a = hh(a, b, c, d, w[5], 4, 0xfffa3942);
    d = hh(d, a, b, c, w[8], 11, 0x8771f681);
    c = hh(c, d, a, b, w[11], 16, 0x6d9d6122);
    b = hh(b, c, d, a, w[14], 23, 0xfde5380c);
    a = hh(a, b, c, d, w[1], 4, 0xa4beea44);
    d = hh(d, a, b, c, w[4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, w[7], 16, 0xf6bb4b60);
    b = hh(b, c, d, a, w[10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, w[13], 4, 0x289b7ec6);
    d = hh(d, a, b, c, w[0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, w[3], 16, 0xd4ef3085);
    b = hh(b, c, d, a, w[6], 23, 0x04881d05);
    a = hh(a, b, c, d, w[9], 4, 0xd9d4d039);
    d = hh(d, a, b, c, w[12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, w[15], 16, 0x1fa27cf8);
    b = hh(b, c, d, a, w[2], 23, 0xc4ac5665);

    a = ii(a, b, c, d, w[0], 6, 0xf4292244);
    d = ii(d, a, b, c, w[7], 10, 0x432aff97);
    c = ii(c, d, a, b, w[14], 15, 0xab9423a7);
    b = ii(b, c, d, a, w[5], 21, 0xfc93a039);
    a = ii(a, b, c, d, w[12], 6, 0x655b59c3);
    d = ii(d, a, b, c, w[3], 10, 0x8f0ccc92);
    c = ii(c, d, a, b, w[10], 15, 0xffeff47d);
    b = ii(b, c, d, a, w[1], 21, 0x85845dd1);
    a = ii(a, b, c, d, w[8], 6, 0x6fa87e4f);
    d = ii(d, a, b, c, w[15], 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, w[6], 15, 0xa3014314);
    b = ii(b, c, d, a, w[13], 21, 0x4e0811a1);
    a = ii(a, b, c, d, w[4], 6, 0xf7537e82);
    d = ii(d, a, b, c, w[11], 10, 0xbd3af235);
    c = ii(c, d, a, b, w[2], 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, w[9], 21, 0xeb86d391);

    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const out = new Uint8Array(16);
  const regs = [a0, b0, c0, d0];
  for (let i = 0; i < 4; i++) {
    out[i * 4] = regs[i] & 0xff;
    out[i * 4 + 1] = (regs[i] >> 8) & 0xff;
    out[i * 4 + 2] = (regs[i] >> 16) & 0xff;
    out[i * 4 + 3] = (regs[i] >>> 24) & 0xff;
  }
  return out;
}

export function parseTable(table) {
  const entries = [];
  for (let o = 0; o + ENTRY_SIZE <= table.length; o += ENTRY_SIZE) {
    const magic = readU16(table, o);
    if (magic === MD5_MAGIC) break;
    if (magic !== MAGIC) break;
    const slice = table.subarray(o, o + ENTRY_SIZE);
    entries.push({
      type: table[o + 2],
      subtype: table[o + 3],
      address: readU32(table, o + 4),
      size: readU32(table, o + 8),
      label: labelOf(slice),
      flags: readU32(table, o + 28),
      raw: new Uint8Array(slice),
    });
  }
  return entries;
}

function encodeEntry({ type, subtype, address, size, label, flags = 0 }) {
  const raw = new Uint8Array(ENTRY_SIZE);
  writeU16(raw, 0, MAGIC);
  raw[2] = type;
  raw[3] = subtype;
  writeU32(raw, 4, address);
  writeU32(raw, 8, size);
  const enc = new TextEncoder().encode(String(label).slice(0, 15));
  raw.set(enc, 12);
  writeU32(raw, 28, flags);
  return raw;
}

export function writeTable(entries) {
  const table = new Uint8Array(TABLE_SIZE);
  table.fill(0xff);
  let o = 0;
  for (const e of entries) {
    const raw = e.raw || encodeEntry(e);
    table.set(raw, o);
    o += ENTRY_SIZE;
  }
  const digest = md5(table.subarray(0, o));
  writeU16(table, o, MD5_MAGIC);
  table.fill(0xff, o + 2, o + 16);
  table.set(digest, o + 16);
  return table;
}

export function isMergedImage(bin) {
  return bin.length > TABLE_OFF + 2 && readU16(bin, TABLE_OFF) === MAGIC;
}

/** Extract ESP app payload from merged flash image or app-only bin. */
export function extractAppImage(bin) {
  if (!isMergedImage(bin)) {
    if (bin[0] !== 0xe9) throw new Error("Not an ESP app image (missing 0xe9 magic)");
    return bin;
  }
  const entries = parseTable(bin.subarray(TABLE_OFF, TABLE_OFF + TABLE_SIZE));
  const app =
    entries.find((e) => e.type === TYPE_APP && e.subtype === SUB_FACTORY) ||
    entries.find((e) => e.type === TYPE_APP);
  if (!app) throw new Error("No app partition in merged image");
  const end = Math.min(bin.length, app.address + app.size);
  let image = bin.subarray(app.address, end);
  let len = image.length;
  while (len > 0 && image[len - 1] === 0xff) len--;
  if (len === 0 || image[0] !== 0xe9) throw new Error("App partition has no valid image");
  return image.subarray(0, len);
}

export function measureAppSize(image) {
  return alignUp(image.length, ALIGN);
}

/**
 * Plan the next ota_* carve from a live partition table.
 * @returns {{ entry, table, appOffset, appSize, freeAfter }}
 */
function isGenericLabel(s) {
  if (!s) return true;
  const t = String(s).trim();
  if (!t) return true;
  if (/^ota_\d+$/i.test(t)) return true;
  if (["app", "firmware", "project", "arduino-lib-builder"].includes(t.toLowerCase())) return true;
  return false;
}

/** Partition label max 15 chars. Prefer catalog name. */
export function pickPartitionLabel(name, index) {
  const raw = !isGenericLabel(name) ? name : `ota_${index}`;
  return String(raw)
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .slice(0, 15) || `ota_${index}`;
}

export function planAppendOta(tableBytes, appImage, opts = {}) {
  if (appImage[0] !== 0xe9) throw new Error("App image missing 0xe9 magic");
  const entries = parseTable(tableBytes);
  if (!entries.length) throw new Error("No Mini Launcher partition table on device — Install Mini Launcher first");

  const hasFactory = entries.some((e) => e.type === TYPE_APP && e.subtype === SUB_FACTORY);
  if (!hasFactory) {
    throw new Error("No factory partition — Install Mini Launcher first");
  }

  const otas = entries.filter(
    (e) => e.type === TYPE_APP && e.subtype >= SUB_OTA_0 && e.subtype <= SUB_OTA_0 + 15
  );

  let end = 0;
  for (const e of entries) end = Math.max(end, e.address + e.size);
  end = alignUp(end, ALIGN);

  const size = measureAppSize(appImage);
  const label = pickPartitionLabel(opts.name, otas.length);
  const existingIdx = entries.findIndex(
    (e) =>
      e.type === TYPE_APP &&
      e.subtype >= SUB_OTA_0 &&
      e.subtype <= SUB_OTA_0 + 15 &&
      e.label.toLowerCase() === label.toLowerCase()
  );

  if (existingIdx >= 0) {
    const existing = entries[existingIdx];
    const isLast = existing.address + existing.size >= end;
    let slotSize = existing.size;
    if (size > existing.size) {
      if (!isLast) {
        throw new Error(
          `"${existing.label}" is already installed but the update needs more space — re-flash Mini Launcher to repack`
        );
      }
      if (existing.address + size > FLASH_SIZE) {
        throw new Error(
          `not enough space (need ${size} bytes, free ${FLASH_SIZE - existing.address})`
        );
      }
      slotSize = size;
    }

    const entry = {
      type: existing.type,
      subtype: existing.subtype,
      address: existing.address,
      size: slotSize,
      label: existing.label,
      flags: existing.flags || 0,
    };
    entry.raw = encodeEntry(entry);

    const newEntries = entries.map((e, i) => (i === existingIdx ? entry : { raw: e.raw }));
    let flashEnd = 0;
    for (let i = 0; i < entries.length; i++) {
      const e = i === existingIdx ? entry : entries[i];
      flashEnd = Math.max(flashEnd, e.address + e.size);
    }

    return {
      entry,
      table: writeTable(newEntries),
      appOffset: entry.address,
      appSize: size,
      freeAfter: FLASH_SIZE - flashEnd,
      otaCount: otas.length,
      replaced: true,
    };
  }

  if (otas.length >= 16) throw new Error("max apps (16)");
  if (end + size > FLASH_SIZE) {
    throw new Error(`not enough space (need ${size} bytes, free ${FLASH_SIZE - end})`);
  }

  const entry = {
    type: TYPE_APP,
    subtype: SUB_OTA_0 + otas.length,
    address: end,
    size,
    label,
    flags: 0,
  };
  entry.raw = encodeEntry(entry);

  const newEntries = [...entries.map((e) => ({ raw: e.raw })), entry];
  const table = writeTable(newEntries);

  return {
    entry,
    table,
    appOffset: end,
    appSize: size,
    freeAfter: FLASH_SIZE - (end + size),
    otaCount: otas.length + 1,
    replaced: false,
  };
}

#!/usr/bin/env python3
"""Merge bootloader + partition table + app into bins/sd-writer-helper.bin."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
ENV = "m5stack-stamps3"
BUILD = ROOT / ".pio" / "build" / ENV
OUT = REPO / "bins" / "sd-writer-helper.bin"


def main() -> int:
    boot = BUILD / "bootloader.bin"
    parts = BUILD / "partitions.bin"
    app = BUILD / "firmware.bin"
    for p in (boot, parts, app):
        if not p.is_file():
            print(f"missing {p} — run: pio run", file=sys.stderr)
            return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    # Prefer project venv esptool, then PATH.
    esptool = REPO / ".venv" / "bin" / "esptool.py"
    cmd = [
        str(esptool) if esptool.is_file() else "esptool.py",
        "--chip",
        "esp32s3",
        "merge_bin",
        "-o",
        str(OUT),
        "--flash_mode",
        "dio",
        "--flash_freq",
        "80m",
        "--flash_size",
        "8MB",
        "0x0",
        str(boot),
        "0x8000",
        str(parts),
        "0x10000",
        str(app),
    ]
    print(" ".join(cmd))
    subprocess.check_call(cmd)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

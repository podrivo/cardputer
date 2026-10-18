# SD writer helper

Tiny Cardputer / Cardputer ADV firmware used by the web installer to copy a
user file onto the **in-device** microSD over USB Serial.

The installer:

1. Flashes `bins/sd-writer-helper.bin`
2. Sends one or more `WRITE` commands with file bytes
3. Flashes the real app firmware (overwriting this helper)

## Limits (v1)

- FAT32 microSD must be inserted before install
- Prefer SDHC, 32 GB or smaller (same guidance as Launcher)
- Protocol supports multiple sequential `WRITE`s (for asset packs)
- Not USB mass-storage mode — use Launcher → USB if you want a Finder drive

## SD pins

Same SPI wiring as Tamaputer / M5 Cardputer:

| Signal | GPIO |
|--------|------|
| SCK    | 40   |
| MISO   | 39   |
| MOSI   | 14   |
| CS     | 12   |

## Serial protocol

Baud: whatever the host opens after reset (installer uses the Web Serial port).
Lines are UTF-8, terminated with `\n`. Binary payloads follow the header line
with **exactly** `nbytes` raw bytes (no encoding).

### Banner

On boot (after SD init attempt):

```
SDWRITE ready
```

### `PING`

```
PING
```

Reply:

```
PONG
```

### `WRITE`

```
WRITE <path> <nbytes>
```

Helper prepares parent dirs, then replies:

```
GO
```

Host must then send:

```
DATA
```

followed by the payload in **512-byte chunks**. After each chunk the helper
replies `ACK <total_received>` (host must wait for ACK before sending more).
Max file size: 512 KiB (buffered in RAM, then written to SD).

- `path` is relative to the SD root, e.g. `tamaputer/tama.b` or `/roms/game.gb`
  (leading `/` optional). Parent directories are created as needed.
- `nbytes` is a decimal byte count.

Success:

```
OK <nbytes>
```

Failure:

```
ERR <message>
```

After `OK` or `ERR`, the helper is idle and accepts another command.

## Build

```bash
cd helper-sd-writer
~/.local/bin/pio run          # or: python3 -m platformio run
```

Copy the merged image into the installer tree:

```bash
python3 merge_and_copy.py
```

That writes `../bins/sd-writer-helper.bin` (bootloader + partition table + app at
the usual ESP32 offsets, flashable at `0x0`).

## Manual smoke test

1. Flash the helper onto a Cardputer with an SD card inserted.
2. Open a serial monitor at 115200.
3. Wait for `SDWRITE ready`.
4. Send (example for a 4-byte file):

```
WRITE hello.txt 4
```

5. Wait for `GO`, send `DATA`, then the 4 raw bytes (`test`).
6. Expect `ACK 4` then `OK 4`. Confirm `hello.txt` on the SD card.

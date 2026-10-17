# Tamagotchi on the M5Stack Cardputer ADV

Notes from getting a virtual pet running on my Cardputer ADV (ESP32-S3, 8 MB flash, MAC `9c:cc:01:e0:81:e4`), connected to the Mac over USB-C at `/dev/cu.usbmodem101`.

## Current state

- **Installed:** [Demonym](https://github.com/eyeofbri/Demonym) `v0.9.23.2-alpha-dev`, flashed on 2026-10-17. It works without an SD card and saves to internal memory (NVS).
- **Backup of the original firmware:** `backup-original-firmware.bin`, a full 8 MB flash dump taken before flashing.

### Demonym controls

| Key | Action |
|---|---|
| `;` `,` `.` `/` | Up, left, down, right |
| `Enter` | Select or confirm |
| `` ` `` | Back, or open the menu |
| `Fn/Opt` + `P` | Screenshot (needs an SD card) |

The full manual is in the repo's [`player_manual.md`](https://github.com/eyeofbri/Demonym/blob/main/player_manual.md).

## Options found

### No SD card needed

| App | Notes |
|---|---|
| [Demonym](https://github.com/eyeofbri/Demonym) | Installed. Built for the ADV and actively maintained. Releases include a merged image for direct flashing (`Demonym-M5Burner-*.bin`). The source code is private. |
| [ViperPet](https://github.com/viper0013/ViperPet) | Made for the ADV and saves to NVS. Small project with no prebuilt release, so it has to be built with PlatformIO. |
| [Purplx](https://github.com/purplxhazee/Purplx-) | A full "cyberdeck OS" for the ADV. It includes a "My Pet" Tamagotchi among many other apps. |

### SD card needed

| App | Notes |
|---|---|
| [Raising Hell](https://github.com/acpayers-alt/raising-hell-cardputer) | The most popular Tamagotchi-style game for the ADV. It needs an SD card for its graphics and sounds, and downloads them over Wi-Fi if they're missing. |
| [Tamaputer](https://github.com/mindovermiles262/tamaputer) | A real Tamagotchi P1 emulator (the example from [M5Burner](https://burner.m5stack.com/2ZCJHE)). It needs a ROM file at `/tamaputer/tama.b` on the SD card. See the next section. |
| [Game Station Emulators](https://github.com/geo-tp/Cardputer-Game-Station-Emulators) | Supports the ADV and emulates Game Boy and many other consoles. It can run the 1997 Game Boy *Tamagotchi* game (`.gb`) from the SD card. |
| [Gameboy Enhanced Firmware](https://github.com/Mr-PauI/Gameboy-Enhanced-Firmware-m5stack-cardputer-) | A Game Boy emulator for the ADV with save states and partial Super Game Boy support. |

## About Tamaputer and the ROM

- [tamalib](https://github.com/jcrona/tamalib) is only the emulator engine, the "console". Tamaputer already includes it as a git submodule.
- The ROM is the "cartridge": Bandai's original 1996 Tamagotchi P1 program. It's copyrighted, so neither repo includes it. You have to dump your own.
- The code expects `tama.b` to be exactly **12,288 bytes**. The README says 40,960, but the size check in `src/tamalib_cardputer_hal.cpp` uses `ROM_SIZE 12288`.
- If the ROM is missing or the wrong size, the app shows a red "not found" error and stops.
- `Tamagotchi (USA, Europe) (SGB Enhanced).gb` is the **Game Boy** game, not the P1 ROM, so it won't work with Tamaputer. Use a Game Boy emulator from the list above instead.
- Without an SD card, Tamaputer could be modified to build the ROM into the firmware and save to NVS.
- The project's description only mentions the original Cardputer, so its keyboard handling may not work on the ADV.

## Flashing with esptool

`esptool` is installed in a local virtual environment:

```bash
python3 -m venv .venv && .venv/bin/pip install esptool
```

Check whether a `.bin` is a **merged** image or an **app-only** image before flashing:

```bash
.venv/bin/esptool.py image_info --version 2 firmware.bin
xxd -s 0x8000 -l 4 firmware.bin   # "aa50" at 0x8000 means a partition table is included
```

- **Merged image:** the entry point is around `0x403c9xxx` and the bytes at `0x8000` are `aa50`. Flash it at `0x0`.
- **App-only image:** the entry point is around `0x4037xxxx` and there is no partition table at `0x8000`. Flash it at `0x10000`, but only if a compatible bootloader and partition table are already on the device. Otherwise build from source, or use M5Launcher from an SD card. The Tamaputer `.bin` is app-only.

```bash
# Flash a merged image
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  write_flash 0x0 Demonym-M5Burner-v0.9.23.2-alpha-dev.bin

# Back up the full flash (takes about 2 minutes)
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  read_flash 0 0x800000 backup.bin

# Restore the original firmware
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  write_flash 0x0 backup-original-firmware.bin
```

## Gotchas

- **"Port is busy":** Google Chrome can hold the serial port if a Web Serial page (such as the M5Burner web flasher) has connected to it. Close that tab and check with `lsof /dev/cu.usbmodem101`.
- **M5Burner's catalog** can be searched as JSON at `https://m5burner-api.m5stack.com/api/firmware`. Firmware files download from `https://m5burner-cdn.m5stack.com/firmware/<file>`.
- **The USB-C cable only provides power and flashing.** Running apps can't read files from the Mac, so anything an app loads from "the SD card" really needs an SD card, or a firmware build that includes the files.

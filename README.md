# Tamagotchi on the M5Stack Cardputer ADV

Notes from getting a virtual pet running on my Cardputer ADV (ESP32-S3, 8 MB flash, MAC `9c:cc:01:e0:81:e4`), connected to the Mac over USB-C at `/dev/cu.usbmodem101`.

## Current state

- **Installed:** [Demonym](https://github.com/eyeofbri/Demonym) `v0.9.23.2-alpha-dev`, flashed on 2026-10-17. It works without an SD card and saves to internal memory (NVS).
- **Backup of the original firmware:** `backup-original-firmware.bin`, kept locally and not in git. It isn't the factory firmware: it holds only the app-only Tamaputer build written at `0x0`, with no bootloader or partition table and the rest of the flash blank, so the device was already unbootable when it was taken. Don't restore it.
- **Official factory firmware:** `cardputer-adv-user-demo-v0.3.bin`, M5Stack's "Cardputer-Adv User Demo" v0.3. It's byte-identical on [M5Burner](https://m5burner-cdn.m5stack.com/firmware/4ed4ab3a388a74e805971f37d6adcc9f.bin) and the [GitHub release](https://github.com/m5stack/M5Cardputer-UserDemo/releases/tag/ADV-V0.3) (`K132-Adv-Cardputer-Adv-UserDemo-V0.3_0x0.bin`, SHA-256 `7bb15324…83b74`). The [Cardputer-Adv docs](https://docs.m5stack.com/en/core/Cardputer-Adv) link its source, the `CardputerADV` branch, as the factory firmware. It's a merged image (bootloader, partition table, `factory` app at `0x10000`) and is what the installer's "Restore original" button flashes, after erasing the whole flash.

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
| [Purplx](https://github.com/purplxhazee/Purplx-) | A full "cyberdeck OS" for the ADV with a "My Pet" app. **Doesn't work on a stock ADV:** most apps draw on an external ILI9341 screen, and choosing "I don't have it" still locks it into two-screen mode ([issue #2](https://github.com/purplxhazee/Purplx-/issues/2)). After flashing it, the Cardputer stopped showing up on USB. Not in the installer. |

### SD card needed

| App | Notes |
|---|---|
| [Raising Hell](https://github.com/acpayers-alt/raising-hell-cardputer) | The most popular Tamagotchi-style game for the ADV. It needs an SD card for its graphics and sounds, and downloads them over Wi-Fi if they're missing. |
| [Tamaputer](https://github.com/mindovermiles262/tamaputer) | A real Tamagotchi P1 emulator (the example from [M5Burner](https://burner.m5stack.com/2ZCJHE)). It needs a ROM file at `/tamaputer/tama.b` on the SD card. See the next section. |
| [Game Station Emulators](https://github.com/geo-tp/Cardputer-Game-Station-Emulators) | Supports the ADV and emulates Game Boy and many other consoles. It can run the 1997 Game Boy *Tamagotchi* game (`.gb`) from the SD card. |
| [Gameboy Enhanced Firmware](https://github.com/Mr-PauI/Gameboy-Enhanced-Firmware-m5stack-cardputer-) | A Game Boy emulator for the ADV with save states and partial Super Game Boy support. |

### Tools

| App | Notes |
|---|---|
| [Launcher](https://github.com/bmorcelli/Launcher) | An app launcher, not a pet. It installs other firmware from the SD card, from a web page it hosts, or over Wi-Fi from M5Burner and GitHub, so you can switch apps without a computer. The `Launcher-m5stack-cardputer.bin` release supports both the original Cardputer and the ADV, and is a merged image (flash at `0x0`). An SD card is optional but makes it more useful. It should be SDHC, 32 GB or smaller, FAT32 with an MBR partition scheme. |
| [Bruce](https://github.com/BruceDevices/firmware) | A security-research firmware with Wi-Fi, Bluetooth, infrared, RF and BadUSB tools. The `Bruce-m5stack-cardputer.bin` release supports the ADV and is a merged image (flash at `0x0`). Only use its attack features on networks and devices you own or have permission to test. |
| [Evil-Cardputer](https://github.com/7h30th3r0n3/Evil-M5Project) | A Wi-Fi auditing firmware (captive portals, scanning, deauth, and more) from the Evil-M5Project. The `binaries/Evil-Cardputer-*.bin` build supports the ADV and is a merged image (flash at `0x0`). An SD card is recommended for captured data and portals. Only use it on networks and devices you own or have permission to test. |

## More to explore

A wider sweep of the Cardputer ecosystem from GitHub, beyond what's in the installer. These are grouped by category and favour the ADV where possible. Unlike the apps above, I haven't verified each one's ADV support or whether it ships a merged image for direct flashing, so check before flashing.

**Curated lists (start here)**

- [awesome-m5stack-cardputer](https://github.com/terremoth/awesome-m5stack-cardputer) — the big index.
- [Cardputer-firmware-list](https://github.com/ru84r8/Cardputer-firmware-list) — firmware-focused list.

**Games & emulators**

- [m5cardputer_doom](https://github.com/romalik/m5cardputer_doom) and [Cardputer-Doom-REBORN](https://github.com/skizzophrenic/Cardputer-Doom-REBORN) — Doom.
- [cardputer-game-os](https://github.com/dkyazzentwatwa/cardputer-game-os) — game launcher + 15 games (ADV).
- [gb_cardputer](https://github.com/matteofo/gb_cardputer) — Game Boy (Peanut-GB port).

**Pets & toys**

- [ClawPuter](https://github.com/bryant24hao/ClawPuter) — pixel desktop companion with AI chat, weather, desktop pet.

**Music & audio**

- [miniacid](https://github.com/urtubia/miniacid) — acid groovebox (ADV).
- [MicroGroove](https://github.com/matoslav/MicroGroove) — 4-track acid groovebox (ADV).
- [GLIDE-Synth](https://github.com/CHARL3X/GLIDE-Synth-Cardputer-ADV) — generative glide synth (ADV).
- [Winamp-style MP3 player](https://github.com/AndyAiCardputer/mp3-player-winamp-cardputer-adv) (ADV).
- [M5Cardputer_WebRadio](https://github.com/cyberwisk/M5Cardputer_WebRadio) — internet radio.

**AI**

- [cardputer-ai](https://github.com/therezor/cardputer-ai) — fully offline tiny LLM baked into firmware (ADV).
- [M5CardputerAI](https://github.com/FelipeLima2/M5CardputerAI) — AI chat via cloud APIs.

**Mesh, radio & comms**

- [plai](https://github.com/d4rkmen/plai) — standalone Meshtastic node (ADV).
- [meshtastic-adv](https://github.com/anton-vinogradov/meshtastic-adv) — Meshtastic client (ADV), advertises one-click browser install.
- [MeshCore-Cardputer-ADV](https://github.com/Stachugit/MeshCore-Cardputer-ADV) / [meshcore-cardputer-adv](https://github.com/sosprz/meshcore-cardputer-adv) — MeshCore clients (ADV).
- [rsCardputer](https://github.com/ratspeak/rsCardputer) — Reticulum/LXMF (ADV).
- [M5Stack-Cardputer-SSH](https://github.com/MangoX0567/M5Stack-Cardputer-SSH) — SSH client (ADV).
- [Ultimate-Remote](https://github.com/geo-tp/Ultimate-Remote) — universal IR remote, 3498 profiles.

**Security / RF / Wi-Fi tools**

- [GhostESP](https://github.com/GhostESP-Revival/GhostESP) — wireless research platform.
- [Picoware](https://github.com/jblanked/Picoware) — multi-device custom firmware, lists the Cardputer ADV.
- [ChimeraBLE](https://github.com/MatthewKuKanich/ChimeraBLE) — BLE security tool with a Cardputer UI.
- [BadCard](https://github.com/VoidNoi/BadCard) — BadUSB with ducky script.
- [Cardputer-ADV-WiFi-BLE-Radar](https://github.com/Zeloksa/Cardputer-ADV-WiFi-BLE-Radar) — Wi-Fi/BLE radar (ADV), ships a precompiled `.bin`.
- [GhostBLE](https://github.com/SmonSE/GhostBLE) — BLE privacy scanner.

Only use the attack features of these on networks and devices you own or have permission to test.

**Sensing & instruments**

- [Cardputer-CSI-Human-Detector](https://github.com/skizzophrenic/Cardputer-CSI-Human-Detector) and [Cardputer-ADV-CSI-Radar](https://github.com/Zeloksa/Cardputer-ADV-CSI-Radar) — detect people through Wi-Fi signal changes.
- [cardputer-oscilloscope](https://github.com/AndyAiCardputer/cardputer-oscilloscope) — pocket oscilloscope + signal generator (has an ADV build).
- [cardputer-satellite-tracker](https://github.com/adammelancon/cardputer-satellite-tracker) / [CardSat](https://github.com/prstoetzer/CardSat) — satellite trackers (ADV).
- [stellar-map](https://github.com/wisnc/stellar-map) — Stellarium-style planetarium (ADV).

**Full OSes, launchers & productivity**

- [MicroHydra](https://github.com/echo-lalia/MicroHydra) — MicroPython app switcher.
- [PaperOS](https://github.com/Artem76228/PaperOS) — launcher, file manager, paint, browser, offline AI, emulator, Lua.
- [NucleoOs](https://github.com/indecenti/NucleoOs) — firmware + browser shell, offline AI, OTA.
- [M5MonsterC5-CardputerADV](https://github.com/C5Lab/M5MonsterC5-CardputerADV) — ADV firmware.
- [Wikipedia-Offline-ADV](https://github.com/Zeloksa/Wikipedia-Offline-ADV) — 6.4M offline Wikipedia articles (ADV).
- [PyDOS](https://github.com/RetiredWizard/PyDOS) — DOS-like OS on MicroPython/CircuitPython.

**Notable oddities**

- [cardputer-claude-os](https://github.com/dakshaymehta/cardputer-claude-os) — Claude companion, BLE + voice (ADV).
- [bitmap16dx](https://github.com/bradmcnally/bitmap16dx) — pixel-art sketchbook (ADV).
- [SOUND-TERRARIUM](https://github.com/kariagepompadour/SOUND-TERRARIUM) — generative world driven by tilt, time and weather (ADV).

## About Tamaputer and the ROM

- [tamalib](https://github.com/jcrona/tamalib) is only the emulator engine, the "console". Tamaputer already includes it as a git submodule.
- The ROM is the "cartridge": Bandai's original 1996 Tamagotchi P1 program. It's copyrighted, so neither repo includes it. You have to dump your own.
- The code expects `tama.b` to be exactly **12,288 bytes**. The README says 40,960, but the size check in `src/tamalib_cardputer_hal.cpp` uses `ROM_SIZE 12288`.
- If the ROM is missing or the wrong size, the app shows a red "not found" error and stops.
- `Tamagotchi (USA, Europe) (SGB Enhanced).gb` is the **Game Boy** game, not the P1 ROM, so it won't work with Tamaputer. Use a Game Boy emulator from the list above instead.
- Without an SD card, Tamaputer could be modified to build the ROM into the firmware and save to NVS. A build like that contains the copyrighted ROM, so it stays out of git and off the installer site.
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
- **App-only image:** the entry point is around `0x4037xxxx` and there is no partition table at `0x8000`. Flash it at `0x10000`, but only if a compatible bootloader and partition table are already on the device. Otherwise build from source, or use [Launcher](https://github.com/bmorcelli/Launcher) to install it from an SD card. The Tamaputer `.bin` is app-only.

```bash
# Flash a merged image
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  write_flash 0x0 Demonym-M5Burner-v0.9.23.2-alpha-dev.bin

# Back up the full flash (takes about 2 minutes)
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  read_flash 0 0x800000 backup.bin

# Restore the original firmware
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  write_flash --erase-all 0x0 cardputer-adv-user-demo-v0.3.bin
```

## Gotchas

- **"Port is busy":** Google Chrome can hold the serial port if a Web Serial page (such as the M5Burner web flasher) has connected to it. Close that tab and check with `lsof /dev/cu.usbmodem101`.
- **M5Burner's catalog** can be searched as JSON at `https://m5burner-api.m5stack.com/api/firmware`. Firmware files download from `https://m5burner-cdn.m5stack.com/firmware/<file>`.
- **The USB-C cable only provides power and flashing.** Running apps can't read files from the Mac, so anything an app loads from "the SD card" really needs an SD card, or a firmware build that includes the files.

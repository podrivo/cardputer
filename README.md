# Cardputer Installers

A one-page browser installer for the [M5Stack Cardputer ADV](https://docs.m5stack.com/en/core/Cardputer-Adv) (ESP32-S3, 8 MB flash). Open `index.html` in Chrome or Edge, plug the Cardputer in over USB-C, and click **Install**.

Firmware images live in [`bins/`](bins/). The page uses [esptool-js](https://github.com/espressif/esptool-js) over Web Serial — no Python or M5Burner required.

## What's in the catalog

| Section | Examples |
|---|---|
| **Pets** | Demonym, ViperPet, Raising Hell, Tamaputer |
| **Games** | Doom, Sound Terrarium, Game Station, Gameboy Enhanced |
| **Tools** | Launcher, Bruce, Evil-Cardputer |
| **Music** | miniacid, MicroGroove, WebRadio |
| **AI** | Cardputer AI (offline LLM) |
| **Mesh** | Meshtastic, Plai, MeshCore, rsCardputer, SSH, Ultimate Remote |
| **Security** | GhostESP, ChimeraBLE, BadCard, Wi-Fi & BLE Radar, GhostBLE |
| **Sensing** | CSI Radar, CSI Human Detector, CardSat |
| **Systems** | MicroHydra, PaperOS, NucleoOS, Wikipedia Offline |
| **Device** | Restore official User Demo v0.3, or erase the whole flash |

Some apps need an SD card (assets, ROMs, samples, databases). Those are tagged in the UI.

## Using the installer

1. Turn the Cardputer **off**, then plug it in over USB-C.
2. Open the page in **Chrome or Edge** on a computer (Web Serial is required).
3. Pick a firmware and click **Install**. Choose the Cardputer in the browser popup.
4. Wait for the write to finish; the device restarts on its own.

Serve the folder over HTTP if you want `bins/` to load automatically (e.g. Netlify, or `npx serve .`). Opening `index.html` as `file://` still works: the page will ask you to pick the `.bin` from `bins/` when it can't fetch it.

**Restore original** flashes M5Stack's [Cardputer-Adv User Demo v0.3](https://github.com/m5stack/M5Cardputer-UserDemo/releases/tag/ADV-V0.3) (`cardputer-adv-user-demo-v0.3.bin`) after erasing the flash. It's a merged image (bootloader, partition table, app at `0x10000`), byte-identical on [M5Burner](https://m5burner-cdn.m5stack.com/firmware/4ed4ab3a388a74e805971f37d6adcc9f.bin) and the GitHub release.

## About Tamaputer and the ROM

- [tamalib](https://github.com/jcrona/tamalib) is only the emulator engine. Tamaputer already includes it as a git submodule.
- The ROM is Bandai's original 1996 Tamagotchi P1 program. It's copyrighted, so neither repo includes it — you have to dump your own.
- The code expects `tama.b` to be exactly **12,288 bytes** at `/tamaputer/tama.b` on the SD card. The README says 40,960, but the size check in `src/tamalib_cardputer_hal.cpp` uses `ROM_SIZE 12288`.
- `Tamagotchi (USA, Europe) (SGB Enhanced).gb` is the **Game Boy** game, not the P1 ROM. Use Game Station or Gameboy Enhanced for that.
- Without an SD card, Tamaputer could be modified to bake the ROM into firmware and save to NVS. That build stays out of git and off the installer.

## Flashing with esptool (CLI)

Useful if you prefer the terminal, or need a full flash backup:

```bash
python3 -m venv .venv && .venv/bin/pip install esptool
```

Check whether a `.bin` is a **merged** image or an **app-only** image before flashing:

```bash
.venv/bin/esptool.py image_info --version 2 firmware.bin
xxd -s 0x8000 -l 4 firmware.bin   # "aa50" at 0x8000 means a partition table is included
```

- **Merged image:** entry point around `0x403c9xxx`, bytes at `0x8000` are `aa50`. Flash at `0x0`. Most files in `bins/` are this kind.
- **App-only image:** entry point around `0x4037xxxx`, no partition table at `0x8000`. Flash at `0x10000` only if a compatible bootloader and partition table are already on the device — or use [Launcher](https://github.com/bmorcelli/Launcher) from an SD card.

```bash
# Flash a merged image from bins/
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  write_flash 0x0 bins/some-firmware.bin

# Back up the full flash (takes about 2 minutes)
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  read_flash 0 0x800000 backup.bin

# Restore the official factory firmware
.venv/bin/esptool.py --chip esp32s3 --port /dev/cu.usbmodem101 --baud 921600 \
  write_flash --erase-all 0x0 bins/cardputer-adv-user-demo-v0.3.bin
```

The serial port is typically `/dev/cu.usbmodem*` on macOS. Adjust as needed.

## Gotchas

- **"Port is busy":** Chrome can hold the serial port if a Web Serial page (this installer or M5Burner) already connected. Close that tab and check with `lsof /dev/cu.usbmodem101`.
- **Black screen after Install:** some M5Burner bins are app-only (no bootloader). The installer flashes those at `0x10000`. If an older build already overwrote `0x0`, use **Restore original** to recover.
- **M5Burner's catalog** can be searched as JSON at `https://m5burner-api.m5stack.com/api/firmware`. Firmware files download from `https://m5burner-cdn.m5stack.com/firmware/<file>`.
- **USB-C only provides power and flashing.** Apps that load files from "the SD card" need a real SD card (or a build that embeds those files).
- **Security / audit firmwares** (Bruce, Evil-Cardputer, GhostESP, etc.): only use attack features on networks and devices you own or have permission to test.

## More Cardputer firmware (not in the installer)

A wider sweep of the ecosystem. Unlike the catalog above, these aren't verified for ADV support or a ready merged image — check before flashing.

**Curated lists:** [awesome-m5stack-cardputer](https://github.com/terremoth/awesome-m5stack-cardputer) · [Cardputer-firmware-list](https://github.com/ru84r8/Cardputer-firmware-list)

**Games & emulators:** [m5cardputer_doom](https://github.com/romalik/m5cardputer_doom) · [Cardputer-Doom-REBORN](https://github.com/skizzophrenic/Cardputer-Doom-REBORN) · [cardputer-game-os](https://github.com/dkyazzentwatwa/cardputer-game-os) · [gb_cardputer](https://github.com/matteofo/gb_cardputer)

**Pets & toys:** [ClawPuter](https://github.com/bryant24hao/ClawPuter) · [Purplx](https://github.com/purplxhazee/Purplx-) (doesn't work on a stock ADV — see [issue #2](https://github.com/purplxhazee/Purplx-/issues/2))

**Music:** [GLIDE-Synth](https://github.com/CHARL3X/GLIDE-Synth-Cardputer-ADV) · [Winamp-style MP3 player](https://github.com/AndyAiCardputer/mp3-player-winamp-cardputer-adv)

**AI:** [M5CardputerAI](https://github.com/FelipeLima2/M5CardputerAI)

**Mesh / RF:** [Picoware](https://github.com/jblanked/Picoware)

**Sensing:** [cardputer-oscilloscope](https://github.com/AndyAiCardputer/cardputer-oscilloscope) · [cardputer-satellite-tracker](https://github.com/adammelancon/cardputer-satellite-tracker) · [stellar-map](https://github.com/wisnc/stellar-map)

**Systems:** [M5MonsterC5-CardputerADV](https://github.com/C5Lab/M5MonsterC5-CardputerADV) · [PyDOS](https://github.com/RetiredWizard/PyDOS)

**Oddities:** [cardputer-claude-os](https://github.com/dakshaymehta/cardputer-claude-os) · [bitmap16dx](https://github.com/bradmcnally/bitmap16dx)

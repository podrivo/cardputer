# Cardputer ADV Installers

Installers for the Cardputer ADV, directly from the browser. Tamagotchis, Games, Tools, Music, mesh, and more. No M5Burner required.

Live at [cardputer-installers.netlify.app](https://cardputer-installers.netlify.app/).

A one-page browser installer for the [M5Stack Cardputer ADV](https://docs.m5stack.com/en/core/Cardputer-Adv) (ESP32-S3, 8 MB flash). Open the site (or `index.html` locally) in Chrome or Edge, plug the Cardputer in over USB-C, and click **Install**.

Firmware images live in [`bins/`](bins/). The page uses [esptool-js](https://github.com/espressif/esptool-js) over Web Serial — no Python or M5Burner required.

## What's in the catalog

| Section | Examples |
|---|---|
| **Pets** | Demonym, ViperPet, Raising Hell, Tamaputer |
| **Games** | Doom, Hazke, Card Craft, Silicon Casino, Puzzles, Battleship, MiniMaze, CardLife, Sound Terrarium, Game Station, Gameboy Enhanced |
| **Tools** | Launcher, Bruce, Evil-Cardputer, Flashlight |
| **Music** | GLIDE, miniacid, MicroGroove, WebRadio |
| **AI** | Cardputer AI, AI Offline Chat |
| **Mesh** | Meshtastic, Plai, MeshCore, rsCardputer, SSH, Ultimate Remote |
| **Security** | GhostESP, ChimeraBLE, BadCard, Wi-Fi & BLE Radar, GhostBLE |
| **Sensing** | CSI Radar, CSI Human Detector, CardSat, IMU Acoustic Analyzer |
| **Systems** | Picoware, MicroHydra, PaperOS, NucleoOS, Wikipedia Offline |
| **Device** | Restore official User Demo v0.3, or erase the whole flash |

Some apps need an SD card (assets, ROMs, samples, databases). Those are tagged in the UI.

## Controls (Keys)

Apps with a documented keymap show a **Keys** link in the catalog. Bindings are scraped from each project's GitHub README (`# Keys` / `# Controls` sections) into [`catalog-keys.js`](catalog-keys.js):

```bash
node scripts/fetch-catalog-keys.mjs
```

Re-run after adding catalog entries, or when upstream READMEs change. Manual overrides can still be set per item with a `keys: { rows: [["Key", "Action"], ...] }` field.

## Using the installer

1. Turn the Cardputer **off**, then plug it in over USB-C.
2. Open the page in **Chrome or Edge** on a computer (Web Serial is required).
3. Pick a firmware and click **Install**. Choose the Cardputer in the browser popup.
4. Wait for the write to finish; the device restarts on its own.

Serve the folder over HTTP if you want `bins/` to load automatically (e.g. Netlify, or `npx serve .`). Opening `index.html` as `file://` still works: the page will ask you to pick the `.bin` from `bins/` when it can't fetch it.

**Restore original** flashes M5Stack's [Cardputer-Adv User Demo v0.3](https://github.com/m5stack/M5Cardputer-UserDemo/releases/tag/ADV-V0.3) (`cardputer-adv-user-demo-v0.3.bin`) after erasing the flash. It's a merged image (bootloader, partition table, app at `0x10000`), byte-identical on [M5Burner](https://m5burner-cdn.m5stack.com/firmware/4ed4ab3a388a74e805971f37d6adcc9f.bin) and the GitHub release.

## SD writer helper (files on the in-device card)

The Cardputer’s microSD is not visible to the Mac over the flash USB link. Apps that need a user file (ROM, stations, asset packs) use a shared temporary firmware:

1. Flash [`bins/sd-writer-helper.bin`](bins/sd-writer-helper.bin)
2. Send `WRITE` commands over Web Serial (see [`helper-sd-writer/README.md`](helper-sd-writer/README.md))
3. Flash the real stock app (overwrites the helper)

Catalog apps opt in with `needsFile.sdPath` / `sdDir` or `sdAssets` (zip expanded to many `WRITE`s). If the helper step fails, the installer falls back to download / folder picker.

Rebuild the helper after editing `helper-sd-writer/`:

```bash
cd helper-sd-writer && pio run && python3 merge_and_copy.py
```

### Tamaputer

- Stock `tamaputer-m5burner` plus a **12,288-byte** P1 ROM at `/tamaputer/tama.b` (copyrighted — not shipped).
- `Tamagotchi (USA, Europe) (SGB Enhanced).gb` is the Game Boy game, not the P1 ROM.

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
- **USB-C flashes firmware; the SD helper copies files onto the in-device card.** Insert a FAT32 microSD before installing apps that need ROMs or assets.
- **Security / audit firmwares** (Bruce, Evil-Cardputer, GhostESP, etc.): only use attack features on networks and devices you own or have permission to test.

## More Cardputer firmware (not in the installer)

A wider sweep of the ecosystem. Unlike the catalog above, these aren't verified for ADV support or a ready merged image — check before flashing.

**Curated lists:** [awesome-m5stack-cardputer](https://github.com/terremoth/awesome-m5stack-cardputer) · [Cardputer-firmware-list](https://github.com/ru84r8/Cardputer-firmware-list)

**Games & emulators:** [m5cardputer_doom](https://github.com/romalik/m5cardputer_doom) · [Cardputer-Doom-REBORN](https://github.com/skizzophrenic/Cardputer-Doom-REBORN) · [cardputer-game-os](https://github.com/dkyazzentwatwa/cardputer-game-os) · [gb_cardputer](https://github.com/matteofo/gb_cardputer)

**Pets & toys:** [ClawPuter](https://github.com/bryant24hao/ClawPuter) · [Purplx](https://github.com/purplxhazee/Purplx-) (doesn't work on a stock ADV — see [issue #2](https://github.com/purplxhazee/Purplx-/issues/2)) · HaroPet (M5Burner 0.1 — boots on ADV but keys dead; original Cardputer keyboard only)

**Music:** [Winamp-style MP3 player](https://github.com/AndyAiCardputer/mp3-player-winamp-cardputer-adv) · [C.P.S.](https://github.com/oldtokage-collab/C.P.S.--Cardputer-SYHNTH--)

**AI:** [M5CardputerAI](https://github.com/FelipeLima2/M5CardputerAI)

**Sensing:** [cardputer-oscilloscope](https://github.com/AndyAiCardputer/cardputer-oscilloscope) · [cardputer-satellite-tracker](https://github.com/adammelancon/cardputer-satellite-tracker) · [stellar-map](https://github.com/wisnc/stellar-map)

**Systems:** [M5MonsterC5-CardputerADV](https://github.com/C5Lab/M5MonsterC5-CardputerADV) · [PyDOS](https://github.com/RetiredWizard/PyDOS)

**Oddities:** [cardputer-claude-os](https://github.com/dakshaymehta/cardputer-claude-os) · [bitmap16dx](https://github.com/bradmcnally/bitmap16dx)

## License

Released under the [MIT license](LICENSE).

## Colophon

A one-page browser installer for the M5Stack Cardputer ADV. Flash pets, games, tools, and more over USB-C without M5Burner or a local Python toolchain. Catalog with per-app keymaps, an in-device SD writer helper, and Netlify hosting for the bins. Vibe coded in a day with [Cursor](https://cursor.com).

**Stack**

| Piece | Choice |
|---|---|
| Page | Single `index.html` (HTML / CSS / JS) |
| Flash | [esptool-js](https://github.com/espressif/esptool-js) over Web Serial |
| Assets | JSZip for SD packs; catalog extras in `catalog-extra.js` / `catalog-keys.js` |
| Dev server | Vite |
| SD helper | PlatformIO firmware in `helper-sd-writer/` |
| Hosting | Netlify |

**Tools**

- [esptool-js](https://github.com/espressif/esptool-js): browser flashing
- [Vite](https://vite.dev/): local serve / reload
- [PlatformIO](https://platformio.org/): SD writer helper builds
- [M5Stack Cardputer ADV](https://docs.m5stack.com/en/core/Cardputer-Adv): the device

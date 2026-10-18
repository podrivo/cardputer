// Curated bulk extras — popular M5Burner apps with a public source link.
// Filtered: requires GitHub/docs link and ≥5000 downloads; skips thin/shady dumps.
export const EXTRA = {
  official: [
    { id: "uiflow2-adv", emoji: "🧩", name: "UIFlow2.0", repo: "https://docs.m5stack.com/en/uiflow2/cardputer-adv/program", desc: "Official visual/block programming firmware for Cardputer ADV", parts: [{ file: "bins/uiflow2-0-cardputer-adv-v2.5.3.bin", address: 0x0 }] },
    { id: "mesh-kit-meshtastic", emoji: "📡", name: "Mesh Kit Meshtastic", repo: "https://docs.m5stack.com/en/guide/cardputer_mesh_kit/meshtastic", desc: "Official Meshtastic firmware for Cardputer ADV with the Cap LoRa-1262", tag: ["warn", "Requires LoRa cap"], parts: [{ file: "bins/mesh-kit-meshtastic-official.bin", address: 0x0 }] },
  ],
  pets: [],
  games: [],
  security: [
    { id: "nemo-for-cardputer-adv", emoji: "🐠", name: "NEMO", repo: "https://github.com/n0xa/m5stick-nemo", desc: "Wireless defense toolkit with BadUSB hunter and Wi-Fi tools", tag: ["warn", "Use responsibly"], parts: [{ file: "bins/nemo-for-cardputer-adv-3.2.2-en-us.bin", address: 0x0 }] },
    { id: "bit-pirate-cardputer-adv", emoji: "🏴‍☠️", name: "Bit Pirate", repo: "https://github.com/geo-tp/ESP32-Bus-Pirate", desc: "Hardware hacking toolkit with a web CLI for many protocols", parts: [{ file: "bins/bit-pirate-cardputer-adv-1.8.bin", address: 0x0 }] },
  ],
  tools: [
    { id: "openwifi-scanner-cardputer-adv", emoji: "🔎", name: "OpenWiFi Scanner", repo: "https://github.com/geo-tp/Open-Wifi-Scanner", desc: "Continuously scans for open Wi-Fi networks with internet access", parts: [{ file: "bins/openwifi-scanner-cardputer-adv-1.0.bin", address: 0x0 }] },
    { id: "usb-bluetooth-mouse-keyboard-cardputer-adv", emoji: "🖱️", name: "USB/Bluetooth HID", repo: "https://github.com/geo-tp/Bluetooth-Keyboard-Mouse-Emulator", desc: "Emulates a USB and Bluetooth keyboard and mouse", parts: [{ file: "bins/usb-bluetooth-mouse-keyboard-cardputer-a-1.1.bin", address: 0x0 }] },
    { id: "password-manager-cardputer-adv", emoji: "🔐", name: "Password Manager", repo: "https://github.com/geo-tp/Password-Manager", desc: "Offline password manager for Cardputer and ADV", parts: [{ file: "bins/password-manager-cardputer-adv-1.0.bin", address: 0x0 }] },
  ],
  mesh: [],
  music: [
    { id: "advanceos-for-cardputer-adv", emoji: "📀", name: "AdvanceOS", repo: "https://github.com/bomberman30/AdvanceOS-for-cardputer", desc: "Lightweight OS focused on file browsing and media playback", parts: [{ file: "bins/advanceos-for-cardputer-adv-1.5.4.bin", address: 0x0 }] },
    { id: "mp3player-for-cardputer-adv-load-2000-songs", emoji: "🎧", name: "MP3 Player", repo: "https://github.com/sanchitminda/MP3PlayerForM5Cardputer", desc: "SD-card MP3 player that can load thousands of tracks", tag: ["warn", "Requires SD"], parts: [{ file: "bins/mp3player-for-cardputer-adv-load-2000-so-5.2.bin", address: 0x0 }] },
  ],
  remotes: [],
  systems: [],
  ai: [
    { id: "m5gemini", emoji: "♊", name: "M5Gemini", repo: "https://github.com/d4rkmen/M5Gemini", desc: "Conversational Gemini assistant using a single Google API key", parts: [{ file: "bins/m5gemini-3.0.bin", address: 0x0 }] },
  ],
  sensing: [],
  misc: [
    { id: "audio-stream-server-cardputer-adv", emoji: "🔊", name: "Audio Stream Server", repo: "https://github.com/geo-tp/M5Cardputer-Audio-Stream-Server", desc: "Streams audio over Wi-Fi and can save network credentials", parts: [{ file: "bins/audio-stream-server-cardputer-adv-1.11.bin", address: 0x0 }] },
    { id: "m5apps", emoji: "📲", name: "M5Apps", repo: "https://github.com/d4rkmen/M5Apps", desc: "On-device app installer from cloud, SD card, or USB", parts: [{ file: "bins/m5apps-2.6.bin", address: 0x0 }] },
    { id: "wifi-remote-display-adv", emoji: "🖥️", name: "WiFi Remote Display", repo: "https://github.com/Zeloksa/WiFi-Remote-Display-ADV", desc: "Streams a Windows PC screen to the Cardputer over Wi-Fi", parts: [{ file: "bins/wifi-remote-display-adv-1.1-26.06.2026.bin", address: 0x0 }] },
  ],
};

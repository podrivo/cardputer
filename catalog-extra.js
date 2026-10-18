// Curated bulk extras — popular M5Burner apps with a public source link.
// Filtered: requires GitHub/docs link and ≥5000 downloads; skips thin/shady dumps.
export const EXTRA = {
  official: [
    { id: "uiflow2-adv", emoji: "🧩", name: "UIFlow2.0", repo: "https://docs.m5stack.com/en/uiflow2/cardputer-adv/program", desc: "Official visual/block programming firmware for Cardputer ADV", parts: [{ file: "bins/uiflow2-0-cardputer-adv-v2.5.3.bin", address: 0x0 }] },
    { id: "mesh-kit-meshtastic", emoji: "📡", name: "Mesh Kit Meshtastic", repo: "https://docs.m5stack.com/en/guide/cardputer_mesh_kit/meshtastic", desc: "Official Meshtastic firmware for Cardputer ADV with the Cap LoRa-1262", tag: ["warn", "Requires LoRa cap"], parts: [{ file: "bins/mesh-kit-meshtastic-official.bin", address: 0x0 }] },
  ],
  pets: [],
  games: [
    { id: "sun-rider", emoji: "☀️", name: "Sun Rider", repo: "https://github.com/Treblewolf/M5Cardputer-Sun-Rider", desc: "Physics side-scroller with procedurally generated terrain", parts: [{ file: "bins/sun-rider-v1.0-m5burner-ed.bin", address: 0x0 }] },
  ],
  security: [
    { id: "nemo-for-cardputer-adv", emoji: "🐠", name: "NEMO", repo: "https://github.com/n0xa/m5stick-nemo", desc: "Wireless defense toolkit with BadUSB hunter and Wi-Fi tools", tag: ["warn", "Use responsibly"], parts: [{ file: "bins/nemo-for-cardputer-adv-3.2.2-en-us.bin", address: 0x0 }] },
    { id: "marauder-for-cardputer", emoji: "⚔️", name: "Marauder", repo: "https://github.com/marivaaldo/ESP32Marauder/tree/feature/add-m5cardputer-support", desc: "ESP32 Marauder Wi-Fi and Bluetooth security toolkit", tag: ["warn", "Requires SD"], parts: [{ file: "bins/marauder-for-cardputer-v1.0.0.bin", address: 0x0 }] },
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
    { id: "cardradio-by-mithug3", emoji: "📻", name: "CardRadio", repo: "https://github.com/mithug3/CARDRADIO", desc: "Internet radio with a built-in station list", parts: [{ file: "bins/cardradio-by-mithug3-0.1.bin", address: 0x10000 }] },
  ],
  remotes: [],
  systems: [],
  ai: [
    { id: "gemini-chatmate-your-ai-assistant", emoji: "💬", name: "Gemini ChatMate", repo: "https://github.com/vanshksingh/M5Cardputer-Chat-with-Gemini-API/", desc: "Chat with Google Gemini from the Cardputer keyboard", tag: ["warn", "Requires SD"], parts: [{ file: "bins/gemini-chatmate-your-ai-assistant-0.1.2.bin", address: 0x0 }] },
    { id: "m5gemini", emoji: "♊", name: "M5Gemini", repo: "https://github.com/d4rkmen/M5Gemini", desc: "Conversational Gemini assistant using a single Google API key", parts: [{ file: "bins/m5gemini-3.0.bin", address: 0x0 }] },
  ],
  sensing: [],
  misc: [
    { id: "audio-stream-server-cardputer-adv", emoji: "🔊", name: "Audio Stream Server", repo: "https://github.com/geo-tp/M5Cardputer-Audio-Stream-Server", desc: "Streams audio over Wi-Fi and can save network credentials", parts: [{ file: "bins/audio-stream-server-cardputer-adv-1.11.bin", address: 0x0 }] },
    { id: "m5apps", emoji: "📲", name: "M5Apps", repo: "https://github.com/d4rkmen/M5Apps", desc: "On-device app installer from cloud, SD card, or USB", parts: [{ file: "bins/m5apps-2.6.bin", address: 0x0 }] },
    { id: "pip-boy-weather-clock-2m8", emoji: "☢️", name: "Pip-Boy Weather Clock", repo: "https://github.com/nishad2m8/Pip-Boy-Weather-Clock", desc: "Retro Pip-Boy weather clock synced over Wi-Fi", parts: [{ file: "bins/pip-boy-weather-clock-2m8-1.0.2.bin", address: 0x0 }] },
    { id: "cardputerlorachat", emoji: "💬", name: "LoRa Chat", repo: "https://github.com/nonik0/CardputerLoRaChat", desc: "Simple chat over LoRa or ESP-NOW", tag: ["warn", "Requires LoRa cap"], parts: [{ file: "bins/cardputerlorachat-0.2.1.bin", address: 0x0 }] },
    { id: "wifi-remote-display-adv", emoji: "🖥️", name: "WiFi Remote Display", repo: "https://github.com/Zeloksa/WiFi-Remote-Display-ADV", desc: "Streams a Windows PC screen to the Cardputer over Wi-Fi", parts: [{ file: "bins/wifi-remote-display-adv-1.1-26.06.2026.bin", address: 0x0 }] },
  ],
};

/*
 * SD writer helper — temporary firmware for the Cardputer web installer.
 * Protocol: see ../README.md
 */

#include <M5Cardputer.h>
#include <SPI.h>
#include <SD.h>
#include <stdarg.h>

#define SD_SPI_SCK_PIN 40
#define SD_SPI_MISO_PIN 39
#define SD_SPI_MOSI_PIN 14
#define SD_SPI_CS_PIN 12

#define CHUNK 512

static bool sd_ok = false;
static bool host_seen = false;
static uint32_t last_announce = 0;
// Lock to the port that delivered the first host byte (Web Serial).
static Stream *host_port = nullptr;

static void host_write(const char *s) {
  if (host_port) {
    host_port->print(s);
    host_port->flush();
    return;
  }
  Serial.print(s);
  Serial.flush();
}

static void host_writeln(const char *s) {
  if (host_port) {
    host_port->println(s);
    host_port->flush();
    return;
  }
  Serial.println(s);
  Serial.flush();
}

static void host_printf(const char *fmt, ...) {
  char buf[160];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  host_write(buf);
}

static void announce_ready() {
  // Mirror on both during announce — host_port may not be known yet.
  Serial.println("SDWRITE ready");
  Serial.flush();
  USBSerial.println("SDWRITE ready");
  USBSerial.flush();
  last_announce = millis();
}

static void show(const char *line1, const char *line2 = "", const char *line3 = "") {
  M5Cardputer.Display.fillScreen(TFT_BLACK);
  M5Cardputer.Display.setTextColor(TFT_WHITE, TFT_BLACK);
  M5Cardputer.Display.setTextSize(1);
  M5Cardputer.Display.setCursor(6, 10);
  M5Cardputer.Display.println("SD Writer");
  M5Cardputer.Display.setCursor(6, 32);
  M5Cardputer.Display.println(line1);
  if (line2[0]) {
    M5Cardputer.Display.setCursor(6, 48);
    M5Cardputer.Display.println(line2);
  }
  if (line3[0]) {
    M5Cardputer.Display.setCursor(6, 64);
    M5Cardputer.Display.println(line3);
  }
}

static bool init_sd() {
  SPI.begin(SD_SPI_SCK_PIN, SD_SPI_MISO_PIN, SD_SPI_MOSI_PIN, SD_SPI_CS_PIN);
  // 4 MHz is more reliable while USB CDC is active on StampS3.
  if (!SD.begin(SD_SPI_CS_PIN, SPI, 4000000)) {
    return false;
  }
  return true;
}

// ESP32 Arduino SD requires absolute paths ("/foo/bar"), not "foo/bar".
static String normalize_path(const String &raw) {
  String p = raw;
  p.trim();
  while (p.startsWith("/")) p.remove(0, 1);
  if (!p.length()) return String("/");
  return String("/") + p;
}

static bool dir_ready(const String &dir) {
  if (SD.exists(dir.c_str())) {
    File f = SD.open(dir.c_str());
    bool ok = f && f.isDirectory();
    if (f) f.close();
    return ok;
  }
  if (SD.mkdir(dir.c_str())) return true;
  if (SD.exists(dir.c_str())) {
    File f = SD.open(dir.c_str());
    bool ok = f && f.isDirectory();
    if (f) f.close();
    return ok;
  }
  return false;
}

static bool ensure_parents(const String &path) {
  int start = 1;
  while (true) {
    int slash = path.indexOf('/', start);
    if (slash < 0) break;
    String dir = path.substring(0, slash);
    if (dir.length() > 1 && !dir_ready(dir)) return false;
    start = slash + 1;
  }
  return true;
}

static int host_available() {
  if (host_port) return host_port->available();
  // Prefer Serial (same CDC esptool / Web Serial usually bind to).
  if (Serial.available()) return Serial.available();
  if (USBSerial.available()) return USBSerial.available();
  return 0;
}

static int host_read() {
  if (host_port) {
    if (!host_port->available()) return -1;
    return host_port->read();
  }
  if (Serial.available()) {
    host_port = &Serial;
    return Serial.read();
  }
  if (USBSerial.available()) {
    host_port = &USBSerial;
    return USBSerial.read();
  }
  return -1;
}

static size_t host_read_bytes(uint8_t *buf, size_t n) {
  size_t got = 0;
  while (got < n && host_available()) {
    int c = host_read();
    if (c < 0) break;
    buf[got++] = (uint8_t)c;
  }
  return got;
}

static bool read_exact(uint8_t *buf, size_t n, uint32_t timeout_ms = 10000) {
  size_t got = 0;
  uint32_t last = millis();
  while (got < n) {
    size_t chunk = host_read_bytes(buf + got, n - got);
    if (chunk) {
      got += chunk;
      last = millis();
    } else if (millis() - last > timeout_ms) {
      return false;
    } else {
      delay(0);
    }
  }
  return true;
}

static void reply_ok(size_t n) {
  host_printf("OK %u\n", (unsigned)n);
}

static void reply_err(const char *msg) {
  host_printf("ERR %s\n", msg);
}

/** Read one text line (no binary). */
static bool read_line(String &out, uint32_t timeout_ms) {
  out = "";
  uint32_t last = millis();
  while (millis() - last < timeout_ms) {
    if (!host_available()) {
      delay(0);
      continue;
    }
    int c = host_read();
    if (c < 0) continue;
    last = millis();
    if (c == '\n') {
      if (out.endsWith("\r")) out.remove(out.length() - 1);
      return true;
    }
    if (c != '\r' && out.length() < 512) out += (char)c;
  }
  return false;
}

static bool write_buffer_to_sd(const String &path, const uint8_t *data, size_t nbytes) {
  if (SD.exists(path.c_str())) SD.remove(path.c_str());
  File f = SD.open(path.c_str(), FILE_WRITE);
  if (!f) return false;
  size_t off = 0;
  while (off < nbytes) {
    size_t n = nbytes - off > CHUNK ? CHUNK : nbytes - off;
    if (f.write(data + off, n) != n) {
      f.close();
      return false;
    }
    off += n;
  }
  f.close();
  return true;
}

static void handle_write(const String &path_raw, size_t nbytes) {
  host_seen = true;
  String path = normalize_path(path_raw);
  char status[48];
  snprintf(status, sizeof(status), "%u bytes", (unsigned)nbytes);

  if (!path.length() || path == "/") {
    reply_err("empty path");
    return;
  }
  if (!sd_ok) {
    reply_err("no sd");
    show("No SD card", "Insert FAT32 SD", "and retry WRITE");
    return;
  }
  if (!ensure_parents(path)) {
    reply_err("mkdir failed");
    show(path.c_str(), status, "mkdir failed");
    return;
  }

  uint8_t *mem = (uint8_t *)malloc(nbytes ? nbytes : 1);
  if (!mem) {
    reply_err("oom");
    show(path.c_str(), "out of memory", "");
    return;
  }

  show(path.c_str(), status, "waiting DATA");
  host_writeln("GO");

  // Host must acknowledge GO with DATA before we accept the payload.
  // Prevents the host from mistaking a later ERR for a failed GO.
  String line;
  if (!read_line(line, 15000) || !line.equalsIgnoreCase("DATA")) {
    free(mem);
    reply_err("no data");
    show(path.c_str(), "no DATA", "");
    return;
  }

  show(path.c_str(), status, "receiving…");
  size_t got = 0;
  while (got < nbytes) {
    size_t n = nbytes - got > CHUNK ? CHUNK : nbytes - got;
    if (!read_exact(mem + got, n, 10000)) {
      free(mem);
      reply_err("rx-timeout");
      show(path.c_str(), "rx timeout", "");
      return;
    }
    got += n;
    host_printf("ACK %u\n", (unsigned)got);
  }

  show(path.c_str(), status, "saving…");
  bool ok = write_buffer_to_sd(path, mem, nbytes);
  free(mem);
  if (!ok) {
    reply_err("write failed");
    show(path.c_str(), "write failed", "");
    return;
  }

  reply_ok(nbytes);
  char done[48];
  snprintf(done, sizeof(done), "OK %u", (unsigned)nbytes);
  show(path.c_str(), done, "idle — flash app next");
}

static void handle_line(String line) {
  line.trim();
  if (!line.length()) return;
  host_seen = true;

  if (line.equalsIgnoreCase("PING")) {
    host_writeln("PONG");
    return;
  }

  if (line.startsWith("WRITE ") || line.startsWith("write ")) {
    int first = line.indexOf(' ');
    int last = line.lastIndexOf(' ');
    if (first < 0 || last <= first) {
      reply_err("bad WRITE");
      return;
    }
    String path = line.substring(first + 1, last);
    path.trim();
    long n = line.substring(last + 1).toInt();
    if (n < 0 || n > 512L * 1024L) {
      reply_err("bad size");
      return;
    }
    handle_write(path, (size_t)n);
    return;
  }

  reply_err("unknown command");
}

void setup() {
  auto cfg = M5.config();
  M5Cardputer.begin(cfg);
  M5Cardputer.Display.setRotation(1);
  M5Cardputer.Display.setBrightness(80);

  Serial.setRxBufferSize(8192);
  Serial.setTxBufferSize(2048);
  Serial.begin(115200);
  USBSerial.setRxBufferSize(8192);
  USBSerial.setTxBufferSize(2048);
  USBSerial.begin(115200);
  delay(300);

  announce_ready();
  show("Mounting SD…", "", "");

  sd_ok = init_sd();
  if (sd_ok) {
    show("SD ready", "Waiting for host", "");
  } else {
    show("No SD card", "Insert FAT32 SD", "Still accepting cmds");
  }

  announce_ready();
}

void loop() {
  static String line;

  if (!host_seen && (millis() - last_announce > 1000)) {
    announce_ready();
  }

  while (host_available()) {
    int c = host_read();
    if (c < 0) break;
    if (c == '\n' || c == '\r') {
      if (line.length()) {
        handle_line(line);
        line = "";
      }
    } else if (line.length() < 512) {
      line += (char)c;
    }
  }
  delay(1);
}

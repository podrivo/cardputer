import net from "node:net";
import { defineConfig } from "vite";

const BASE_PORT = 3000;

// Vite only checks the host it binds to, so a server on another address
// (e.g. `*:3000` vs `[::1]:3000`) goes unnoticed and both share the port.
const PROBE_HOSTS = ["::", "0.0.0.0", "::1", "127.0.0.1"];

function isFree(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => resolve(err.code === "EADDRNOTAVAIL" || err.code === "EAFNOSUPPORT"));
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

async function findPort(start) {
  for (let port = start; port < start + 100; port++) {
    let free = true;
    for (const host of PROBE_HOSTS) {
      if (!(await isFree(port, host))) {
        free = false;
        break;
      }
    }
    if (free) return port;
  }
  throw new Error(`No free port found in ${start}-${start + 99}`);
}

export default defineConfig(async ({ command }) => ({
  server: {
    port: command === "serve" ? await findPort(BASE_PORT) : BASE_PORT,
    strictPort: true,
    open: "/index.html",
    watch: {
      ignored: [
        "**/bins/**",
        "**/.venv/**",
        "**/helper-sd-writer/.pio/**",
        "**/node_modules/**",
      ],
    },
  },
}));

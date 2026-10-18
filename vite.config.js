import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
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
});

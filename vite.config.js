import { defineConfig } from "vite";

export default defineConfig({
  server: {
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

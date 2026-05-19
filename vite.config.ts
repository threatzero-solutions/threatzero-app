/// <reference types="vitest/config" />
import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Short git SHA, injected at build time as `__APP_VERSION__`. Surfaced in
// the chrome footer so a user can quote it on support tickets. Falls back
// to "dev" when not in a git tree (e.g. inside a Docker image without git).
const gitSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
})();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(gitSha),
  },
  server: {
    allowedHosts: [".argo.gibsonops.com"],
  },
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});

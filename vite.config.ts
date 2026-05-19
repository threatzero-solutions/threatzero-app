/// <reference types="vitest/config" />
import { execSync } from "node:child_process";
import { sentryVitePlugin } from "@sentry/vite-plugin";
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

// Sourcemap upload to Sentry only fires when the auth token + project are
// set in the build environment. Local `npm run build` without them stays
// silent and still produces a working bundle.
const sentryPluginEnabled =
  !!process.env.SENTRY_AUTH_TOKEN && !!process.env.SENTRY_PROJECT;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(sentryPluginEnabled
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: gitSha },
          }),
        ]
      : []),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(gitSha),
  },
  build: {
    sourcemap: "hidden",
  },
  server: {
    allowedHosts: [".argo.gibsonops.com"],
  },
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate from vite.config.js on purpose: tests do not need the Laravel
// plugin (no PHP dev server), only React + a DOM environment.
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./resources/js/test/setup.ts"],
        include: ["resources/js/**/*.{test,spec}.{ts,tsx}"],
        css: false,
    },
});

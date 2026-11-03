import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const decorators = require("@babel/plugin-proposal-decorators");

export default defineConfig({
  plugins: [
    react(),
    babel({
      plugins: [[decorators, { version: "2023-11" }]],
      presets: [reactCompilerPreset()],
    }),
  ],
  build: {
    target: "es2023",
    lib: {
      entry: {
        index: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        rules: fileURLToPath(new URL("./src/rules.ts", import.meta.url)),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: /^(react|react-dom)(\/.*)?$/,
    },
  },
});
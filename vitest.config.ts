import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import libraryConfig from "./vite.config.ts";
import { fileURLToPath } from "node:url";

export default mergeConfig(libraryConfig, defineConfig({
  resolve: {
    alias: [
      { find: "@local/form-builder/rules", replacement: fileURLToPath(new URL("./src/rules.ts", import.meta.url)) },
      { find: "@local/form-builder", replacement: fileURLToPath(new URL("./src/index.ts", import.meta.url)) },
      { find: "antd", replacement: fileURLToPath(new URL("./verification/consumer/node_modules/antd", import.meta.url)) },
      { find: "dayjs", replacement: fileURLToPath(new URL("./verification/consumer/node_modules/dayjs", import.meta.url)) },
      { find: "react", replacement: fileURLToPath(new URL("./verification/consumer/node_modules/react", import.meta.url)) },
      { find: "react-dom", replacement: fileURLToPath(new URL("./verification/consumer/node_modules/react-dom", import.meta.url)) },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    maxWorkers: 1,
    fileParallelism: false,
    restoreMocks: true,
  },
}));
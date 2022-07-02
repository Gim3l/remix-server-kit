const path = require("path");
const { defineConfig } = require("vite");
import typescript from "@rollup/plugin-typescript";

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "RemixServerKit",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      input: "./src/index.ts",
      external: [
        "@remix-run/node",
        "@remix-run/react",
        "@remix-run/node",
        "superstruct",
      ],
      output: {
        dir: "dist",
        format: "umd",
      },
      plugins: [typescript({ tsconfig: "./tsconfig.json" })],
    },
  },
});

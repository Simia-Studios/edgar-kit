import { defineConfig } from "tsdown";

export default defineConfig({
  format: ["esm"],
  sourcemap: true,
  dts: true,
  clean: true,
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
  },
});

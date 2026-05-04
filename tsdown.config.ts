import { defineConfig } from "tsdown";

export default defineConfig({
  format: ["esm"],
  sourcemap: true,
  dts: true,
  clean: true,
  entry: {
    index: "src/index.ts",
  },
});

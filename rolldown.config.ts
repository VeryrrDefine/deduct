import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.ts",
  output: [
    {
      file: "dist/deduct.js",
      format: "umd",
      name: "deduct",
      sourcemap: true,
      exports: "auto",
    },
    {
      file: "dist/deduct.esm.js",
      format: "es",
      name: "deduct",
      sourcemap: true,
    },
  ],
});

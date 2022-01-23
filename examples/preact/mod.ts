import { build } from "../../packages/core/mod.ts";
import * as path from "../../dep/std/path.ts";
import { script } from "../../packages/loader_script/mod.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);

build({
  root: ROOT,
  outputDir: "./dist",
  importMap: "./import_map.json",
  loaders: [script({
    name: "body",
    test: (url) => /\.script\.ts$/.test(url.toString()),
    format: ["esm"],
  })],
  pages: [
    "./page.tsx",
  ],
});

declare global {
  interface Crypto {
    randomUUID: () => string;
  }
}
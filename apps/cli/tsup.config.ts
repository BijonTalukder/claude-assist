import { createRequire } from 'node:module';
import { defineConfig } from 'tsup';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Real npm dependencies stay external (installed normally by npm).
// Everything else reachable from src/index.ts — in particular the
// unpublished @claude-assist/* workspace packages — gets inlined here so
// the published tarball never contains an unresolved workspace import.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  external: Object.keys(pkg.dependencies ?? {}),
  clean: false,
  dts: false,
  shims: false,
  splitting: false,
  sourcemap: false,
});

import { defineConfig } from 'tsup';

// This server is copied verbatim (no node_modules) into the published
// claude-assist CLI package and run standalone via `node`. It is fully
// bundled (CJS) so express and the unpublished @claude-assist/usage
// workspace package are inlined — the output has no runtime dependencies
// whatsoever, so it can never fail to resolve a package on whatever machine
// it's installed on. CJS (not ESM) because express's CJS dependency graph
// (e.g. depd's dynamic require) cannot be safely bundled to ESM.
export default defineConfig({
  entry: { 'server/index': 'server/index.ts' },
  format: ['cjs'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  // tsup externalizes `dependencies` by default; override so express is
  // inlined and the bundle is fully self-contained.
  noExternal: [/.*/],
  clean: false,
  dts: false,
  shims: false,
  splitting: false,
  sourcemap: false,
});

import { defineConfig } from 'tsup';
import { version } from './package.json';

export default defineConfig({
  // Entry points
  entry: ['src/index.ts'],

  // Output formats
  format: ['cjs', 'esm'],

  // Generate .d.ts files
  dts: true,

  // Source maps for debugging
  sourcemap: true,

  // Clean output directory before build
  clean: true,

  // Minify output
  minify: true,

  // Split code (tree-shaking friendly)
  splitting: false,

  // Bundle dependencies (we have zero runtime deps)
  external: [],

  // Target environment
  target: 'es2020',

  // Inject version from package.json at build time
  define: {
    __SDK_VERSION__: JSON.stringify(version),
  },

  // Output file naming
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },

  // Additional UMD build for CDN usage
  globalName: 'ChaindocEmbed',
});

import { defineConfig } from 'tsup';
import { version } from './package.json';

export default defineConfig([
  // NPM build (CommonJS + ESM)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    splitting: false,
    external: [],
    target: 'es2020',
    define: {
      __SDK_VERSION__: JSON.stringify(version),
    },
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.mjs',
      };
    },
  },
  // CDN build (IIFE for <script> tags)
  {
    entry: { 'embed-sdk.umd': 'src/index.ts' },
    format: ['iife'],
    globalName: 'ChaindocEmbed',
    sourcemap: true,
    minify: true,
    splitting: false,
    external: [],
    target: 'es2020',
    define: {
      __SDK_VERSION__: JSON.stringify(version),
    },
    outExtension() {
      return { js: '.js' };
    },
  },
]);

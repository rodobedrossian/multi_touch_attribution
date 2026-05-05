import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/analytics.min.js',
    format: 'iife',
    name: '_attrSnippet',
    sourcemap: true,
  },
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    terser({
      compress: { passes: 2 },
      mangle: true,
    }),
  ],
};

import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import external from 'rollup-plugin-node-externals'
import json from '@rollup/plugin-json'

function buildBanner(type) {
  return [
    '/*!',
    ` * ${pkg.name} ${type} ${pkg.version}`,
    ` * (c) 2020 - ${new Date().getFullYear()} ${pkg.anchor || ''}`,
    ' * Released under the MIT License.',
    ' */'
  ].join('\n')
}

const config = {
  input: './src/index.ts',
  output: [],
  plugins: [
    external({
      deps: true
    }),
    nodeResolve({ jsnext: true }),
    commonjs(),
    json(),
    typescript({
      typescript: require('typescript')
    })
  ],
  external: []
}

export default [
  {
    input: config.input,
    output: [
      {
        file: './output/index.js',
        format: 'cjs',
        banner: buildBanner('cjs'),
        exports: 'named',
        sourcemap: false
      }
    ],
    plugins: config.plugins,
    external: config.external
  }
]

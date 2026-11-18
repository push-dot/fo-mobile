const path = require('node:path')

const SRC = path.resolve(__dirname, '../src')
const FEATURES = path.join(SRC, 'features')

const resolveSpec = (spec, filename) => {
  if (spec.startsWith('@/')) return path.join(SRC, spec.slice(2))
  if (spec.startsWith('.')) return path.resolve(path.dirname(filename), spec)
  return null
}

const inside = (dir, file) => !path.relative(dir, file).startsWith('..')

/**
 * A feature is used through its index. `features` names the features this file may not reach into, and `open`
 * names the paths inside a feature it may still import ("types", "utils/" for the folder).
 */
const noDeepImport = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: { features: { type: 'array', items: { type: 'string' } }, open: { type: 'array', items: { type: 'string' } } },
        additionalProperties: false,
      },
    ],
    messages: { deep: "Import '@/features/{{feature}}', not '{{path}}' inside it." },
  },
  create(context) {
    const { features = [], open = [] } = context.options[0] ?? {}
    const check = (node) => {
      if (typeof node?.value !== 'string') return
      const target = resolveSpec(node.value, context.filename)
      if (!target || !inside(FEATURES, target)) return
      const [feature, ...rest] = path.relative(FEATURES, target).split(path.sep)
      const sub = rest.join('/').replace(/\.tsx?$/, '')
      if (!features.includes(feature) || sub === '' || sub === 'index') return
      if (inside(path.join(FEATURES, feature), context.filename)) return
      if (open.some((p) => (p.endsWith('/') ? sub.startsWith(p) : sub === p))) return
      context.report({ node, messageId: 'deep', data: { feature, path: sub } })
    }
    return {
      ImportDeclaration: (n) => check(n.source),
      ExportAllDeclaration: (n) => check(n.source),
      ExportNamedDeclaration: (n) => check(n.source),
      ImportExpression: (n) => check(n.source),
    }
  },
}

const plugin = { rules: { 'no-deep-import': noDeepImport } }
const RULE = 'feature-boundaries/no-deep-import'

// Files that run in node under vitest. A feature's index re-exports its components and vitest cannot load
// react-native, so these may import the files of a feature that hold no component.
const NODE_FILES = ['src/mock/**', 'src/**/__tests__/**', 'src/**/*.test.ts']
const NODE_OPEN = ['constants', 'types', 'error-text', 'utils/']
const ALL = ['bots', 'materials', 'chat']

module.exports = [
  { files: ['src/**/*.{ts,tsx}'], plugins: { 'feature-boundaries': plugin } },
  { files: ['src/**/*.{ts,tsx}'], ignores: NODE_FILES, rules: { [RULE]: ['error', { features: ALL }] } },
  { files: NODE_FILES, rules: { [RULE]: ['error', { features: ALL, open: NODE_OPEN }] } },
]

// Writes .expo/types/router.d.ts the way `expo start` does, so `tsc` checks every route string in CI too.
// .expo is git-ignored and CI never starts Metro: without this step typedRoutes checks nothing there.
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, '.expo/types')
const out = path.join(outDir, 'router.d.ts')

// Read when the generator module loads, as @expo/cli sets it before requiring the module.
process.env.EXPO_ROUTER_APP_ROOT = path.join(root, 'src/app')

// @expo/router-server is a dependency of expo, not of the app, so resolve it from expo's folder.
const expoDir = path.dirname(require.resolve('expo/package.json', { paths: [root] }))
const { regenerateDeclarations } = require(require.resolve('@expo/router-server/build/typed-routes', { paths: [expoDir] }))

fs.mkdirSync(outDir, { recursive: true })
fs.rmSync(out, { force: true })
regenerateDeclarations(outDir, {})

// The generator is debounced and logs its errors instead of throwing. A missing file would let tsc accept any route.
process.on('exit', () => {
  if (fs.existsSync(out)) return
  console.error(`gen-typed-routes: ${path.relative(root, out)} was not written`)
  process.exitCode = 1
})

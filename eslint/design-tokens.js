const designSystem = require('../../../packages/design-system/tokens/design-system.json')
const app = require('../../../packages/design-system/tokens/push-app.json')
const allowlist = require('./design-allowlist')

const px = (v) => Number.parseFloat(v)
const unique = (values) => [...new Set(values)].sort((a, b) => a - b)
const styles = designSystem.type.groups.flatMap((g) => g.styles)

const SPACING = unique(designSystem.spacing.tokens.map((t) => px(t.value)))
const RADIUS = unique([
  ...designSystem.radius.tokens.map((t) => px(t.value)),
  ...Object.entries(app.radius).filter(([k]) => !k.startsWith('phone')).map(([, v]) => px(v)),
])
const FONT_SIZE = unique(styles.map((s) => px(s.fontSize)))
const LINE_HEIGHT = unique(styles.map((s) => px(s.lineHeight)))

const oneOf = (values) => `/^(${values.map((v) => String(v).replace('.', '\\.')).join('|')})$/`
const BANNED_COLOR_NAMES = 'white|black|blue|gray|grey|purple|yellow|pink|brown|cyan|magenta'
const HINT = 'Read it from @/theme (useColors, type, radius, spacing, useShadow, fontFor) or add it to the design-system tokens.'

const numeric = (keys, values, what) => ({
  selector: `Property[key.name=${keys}] Literal[raw=${oneOf(values)}]:not(MemberExpression > Literal)`,
  message: `Raw ${what} matches a design token. ${HINT}`,
})

const restricted = [
  { selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]', message: `Raw hex colour. ${HINT}` },
  { selector: 'Literal[value=/^(rgba?|hsla?)\\(/]', message: `Raw rgb()/hsl() colour. ${HINT}` },
  { selector: `Property[key.name=/[cC]olor$/] Literal[value=/^(${BANNED_COLOR_NAMES})$/]`, message: `Named colour. ${HINT}` },
  { selector: `JSXAttribute[name.name=/[cC]olor$/] Literal[value=/^(${BANNED_COLOR_NAMES})$/]`, message: `Named colour. ${HINT}` },
  { selector: 'Property[key.name="fontFamily"]', message: `Raw fontFamily. Use Text or fontFor() from @/theme.` },
  {
    selector: 'MemberExpression[object.name=/^(spacing|radius|type)$/] > MemberExpression.property',
    message: 'Nested token lookup. Write spacing[4], not spacing[spacing[1]].',
  },
  numeric('/^(gap|rowGap|columnGap|padding|margin)(Top|Bottom|Left|Right|Start|End|Horizontal|Vertical)?$/', SPACING, 'spacing'),
  numeric('/^border\\w*Radius$/', RADIUS, 'radius'),
  numeric('"fontSize"', FONT_SIZE, 'fontSize'),
  numeric('"lineHeight"', LINE_HEIGHT, 'lineHeight'),
]

module.exports = [
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', 'src/**/*.test.ts'],
    rules: { 'no-restricted-syntax': ['error', ...restricted] },
  },
  ...(allowlist.length
    ? [{ files: allowlist.map((entry) => entry.file), rules: { 'no-restricted-syntax': 'off' } }]
    : []),
]

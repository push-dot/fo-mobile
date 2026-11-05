import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../../../..')
const GLASS = new Set(['Glass', 'GlassView'])
const PRESSABLE = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight'])
const MENU = new Set(['Menu', 'ContextMenu'])
const PRESS_MOTION = /\b(scale|opacity)\b/
const ANIMATED_MOTION = /\bscale\b/

const tsxFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? tsxFiles(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : [],
  )

const opening = (n: ts.Node) => (ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : null)

const attr = (n: ts.JsxOpeningLikeElement, names: string[]) =>
  n.attributes.properties.find((p) => ts.isJsxAttribute(p) && names.includes(p.name.getText()))

const on = (n: ts.JsxOpeningLikeElement, names: string[]) => {
  const a = attr(n, names)
  return !!a && ts.isJsxAttribute(a) && a.initializer?.getText() !== '{false}'
}

const isPressable = (n: ts.JsxOpeningLikeElement) => PRESSABLE.has(n.tagName.getText())

const hasPressableChild = (n: ts.Node): boolean =>
  ts.forEachChild(n, (child) => {
    const o = opening(child)
    return (o && isPressable(o)) || hasPressableChild(child) || undefined
  }) ?? false

const glassPressViolations = (file: string, source: string) => {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: string[] = []
  const at = (n: ts.Node, why: string) => found.push(`${file}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1} ${why}`)
  const visit = (n: ts.Node) => {
    const o = opening(n)
    if (o && GLASS.has(o.tagName.getText())) {
      let pressedBy: ts.JsxOpeningLikeElement | null = null
      for (let p = n.parent; p && !ts.isFunctionLike(p); p = p.parent) {
        const po = opening(p)
        if (!po) continue
        const tag = po.tagName.getText()
        const style = attr(po, ['style'])?.getText() ?? ''
        const moves = isPressable(po) ? PRESS_MOTION.test(style) : tag.startsWith('Animated') && ANIMATED_MOTION.test(style)
        if (moves) at(n, `glass inside a ${tag} that scales or fades it`)
        if (isPressable(po) || MENU.has(tag)) pressedBy ??= po
      }
      if ((pressedBy || hasPressableChild(n)) && !on(o, ['interactive', 'isInteractive'])) at(n, 'pressable glass without interactive')
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return found
}

describe('glass press guard', () => {
  it('flags a scaled wrapper and a non-interactive pressable glass', () => {
    const bad = `const A = () => <Pressable style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}><Glass interactive /></Pressable>
const B = () => <Glass><Pressable onPress={f} /></Glass>
const C = () => <Menu actions={a}><Glass /></Menu>`
    expect(glassPressViolations('x.tsx', bad)).toEqual([
      'x.tsx:1 glass inside a Pressable that scales or fades it',
      'x.tsx:2 pressable glass without interactive',
      'x.tsx:3 pressable glass without interactive',
    ])
  })

  it('accepts interactive glass that owns the press', () => {
    const good = `const A = () => <Glass interactive><Pressable onPress={f} /></Glass>
const B = () => <Pressable onPress={f}><Glass interactive /></Pressable>
const C = () => <Glass style={s}><Text /></Glass>`
    expect(glassPressViolations('x.tsx', good)).toEqual([])
  })

  it('finds no glass press bug in the app', () => {
    const src = join(ROOT, 'src')
    const found = tsxFiles(src).flatMap((f) => glassPressViolations(relative(ROOT, f), readFileSync(f, 'utf8')))
    expect(found).toEqual([])
  })
})

const hex = (channel: string) => Number(channel).toString(16).padStart(2, '0').toUpperCase()

export const nativeShadow = (css: string) => {
  const layer = css.match(/^(-?[\d.]+)(?:px)? (-?[\d.]+)(?:px)? ([\d.]+)(?:px)? rgba\((\d+),(\d+),(\d+),([\d.]+)\)/)
  if (!layer) throw new Error(`Cannot draw shadow natively: ${css}`)
  const [, x, y, blur, r, g, b, alpha] = layer
  return {
    shadowColor: `#${hex(r)}${hex(g)}${hex(b)}`,
    shadowOpacity: Number(alpha),
    shadowRadius: Number(blur) / 2,
    shadowOffset: { width: Number(x), height: Number(y) },
  }
}

type LayerShadow = {
  shadowColor: string
  shadowOpacity: number
  shadowRadius: number
  shadowOffset: { width: number; height: number }
}

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')

export const toBoxShadow = ({ shadowColor, shadowOpacity, shadowRadius, shadowOffset }: LayerShadow) =>
  `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius * 2}px rgba(${channels(shadowColor)},${shadowOpacity})`

import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Text, useReduceMotion } from '@/shared/components'
import { useColors } from '../../../../theme'

export const Dot = ({ color, size = 8, top = 8 }: { color: string; size?: number; top?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginTop: top }} />
)

const Glyph = ({ still, size = 17, color }: { still?: boolean; size?: number; color?: string }) => {
  const c = useColors()
  const reduce = useReduceMotion()
  const frames = ['·', '✢', '✳', '✶', '✻', '✽']
  const [i, setI] = useState(4)
  useEffect(() => {
    if (still || reduce) return
    const timer = setInterval(() => setI((n) => (n + 1) % frames.length), 1100 / frames.length)
    return () => clearInterval(timer)
  }, [still, reduce, frames.length])
  return (
    <Text style={{ width: size + 1, textAlign: 'center', fontSize: size, lineHeight: 20, color: color ?? c.ac }} accessibilityElementsHidden>
      {frames[still || reduce ? 4 : i]}
    </Text>
  )
}

export default Glyph

import { useState } from 'react'
import { Pressable } from 'react-native'
import { Text } from '@/shared/components'

/** Grey sub-text inside a bubble: one line until a tap opens it, to `more` when the long form differs (rule 30). */
const Detail = ({ text, more }: { text: string; more?: string }) => {
  const [open, setOpen] = useState(false)
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)}>
      <Text v="c1" color="t3" numberOfLines={open ? undefined : 1} style={{ fontSize: 14, lineHeight: 20 }}>
        {open ? (more ?? text) : text}
      </Text>
    </Pressable>
  )
}

export default Detail

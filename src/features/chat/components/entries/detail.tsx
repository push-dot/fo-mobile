import { useState } from 'react'
import { Pressable } from 'react-native'
import { Text } from '@/shared/components'

/** Grey sub-text inside a bubble: one line until a tap opens the rest (rule 30). */
const Detail = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false)
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)}>
      <Text v="c1" color="t3" numberOfLines={open ? undefined : 1}>
        {text}
      </Text>
    </Pressable>
  )
}

export default Detail

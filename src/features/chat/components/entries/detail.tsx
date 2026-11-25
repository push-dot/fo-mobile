import { useState } from 'react'
import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'

const Detail = ({ text, more }: { text: string; more?: string }) => {
  const [open, setOpen] = useState(false)
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)}>
      <Text v="c1" color="t3" numberOfLines={open ? undefined : 1} style={styles.text}>
        {open ? (more ?? text) : text}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 20 },
})

export default Detail

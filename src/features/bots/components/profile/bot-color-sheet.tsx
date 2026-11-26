import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button, Sheet, Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { mascotPalette } from '../../../../theme/mascot'
import { useSetBotColor } from '../../api/hooks'
import { BOT_COLORS } from '../../constants'
import type { BotColor, CompanyBot } from '../../types'
import { COLOR_TITLE, DONE_LABEL, colorA11y } from './profile-rows'

const DOT = 28
const RING = 2
const GAP = 3

const BotColorSheet = ({ bot, onClose }: { bot: CompanyBot; onClose: () => void }) => {
  const { setColor, isPending } = useSetBotColor()
  const [picked, setPicked] = useState<BotColor>(bot.color)
  const apply = async () => {
    try {
      await setColor(bot, picked)
      onClose()
    } catch {
      setPicked(bot.color)
    }
  }
  const row = (colors: readonly BotColor[], start: number) => (
    <View style={styles.row}>
      {colors.map((color, index) => {
        const on = color === picked
        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={colorA11y(start + index)}
            onPress={() => setPicked(color)}
            style={styles.hit}
          >
            <View
              style={[styles.ring, on && styles.ringOn]}
            >
              <View
                style={styles.dot(color)}
              />
            </View>
          </Pressable>
        )
      })}
    </View>
  )
  return (
    <Sheet gap={16}>
      <Text v="h3" accessibilityRole="header" style={styles.title}>
        {COLOR_TITLE}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={COLOR_TITLE} style={styles.rows}>
        {row(BOT_COLORS.slice(0, 6), 0)}
        {row(BOT_COLORS.slice(6), 6)}
      </View>
      <Button label={DONE_LABEL} pending={isPending} onPress={() => void apply()} style={styles.done} />
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  hit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ring: { padding: GAP + RING, borderWidth: 0, borderColor: theme.colors.t1, borderRadius: theme.radius.pill, backgroundColor: 'transparent' },
  ringOn: { padding: GAP, borderWidth: RING, backgroundColor: theme.colors.bg },
  dot: (color: BotColor) => ({ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: mascotPalette(color, theme.mode).body }),
  title: { textAlign: 'center' },
  rows: { gap: 2 },
  done: { marginTop: theme.spacing[1] },
}))

export default BotColorSheet

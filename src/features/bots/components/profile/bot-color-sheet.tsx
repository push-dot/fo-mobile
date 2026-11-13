import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button, Sheet, Text } from '@/shared/components'
import { radius, spacing, useColors, useThemeMode } from '../../../../theme'
import { mascotPalette } from '../../../../theme/mascot'
import { useSetBotColor } from '../../api/hooks'
import { BOT_COLORS } from '../../constants'
import type { BotColor, CompanyBot } from '../../types'
import { COLOR_TITLE, DONE_LABEL, colorA11y } from './profile-rows'

const DOT = 28
const RING = 2
const GAP = 3

const BotColorSheet = ({ bot, onClose }: { bot: CompanyBot; onClose: () => void }) => {
  const c = useColors()
  const mode = useThemeMode()
  const setColor = useSetBotColor()
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
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {colors.map((color, index) => {
        const on = color === picked
        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={colorA11y(start + index)}
            onPress={() => setPicked(color)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                padding: on ? GAP : GAP + RING,
                borderWidth: on ? RING : 0,
                borderColor: c.t1,
                borderRadius: radius.pill,
                backgroundColor: on ? c.bg : 'transparent',
              }}
            >
              <View
                style={{
                  width: DOT,
                  height: DOT,
                  borderRadius: DOT / 2,
                  backgroundColor: mascotPalette(color, mode).body,
                }}
              />
            </View>
          </Pressable>
        )
      })}
    </View>
  )
  return (
    <Sheet gap={16}>
      <Text v="h3" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {COLOR_TITLE}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={COLOR_TITLE} style={{ gap: 2, paddingVertical: spacing[2] }}>
        {row(BOT_COLORS.slice(0, 6), 0)}
        {row(BOT_COLORS.slice(6), 6)}
      </View>
      <Button label={DONE_LABEL} onPress={() => void apply()} />
    </Sheet>
  )
}

export default BotColorSheet

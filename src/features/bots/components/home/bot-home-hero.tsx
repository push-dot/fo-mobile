import { Pressable, View } from 'react-native'
import { Mascot, Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import type { MascotState } from '../../types'
import { heroLabel, type HomeMotion } from '../../utils/home-rows'
import { HERO_NAME } from './copy'
import type { HomeChrome } from './metrics'

const BotHomeHero = ({
  chrome,
  state,
  unread,
  motion,
  onPress,
}: {
  chrome: HomeChrome
  state: MascotState
  unread: boolean
  motion: HomeMotion
  onPress: () => void
}) => {
  const c = useColors()
  const wrap = { alignItems: 'center' as const, paddingTop: 2, paddingHorizontal: 32, paddingBottom: 14 }
  const nameRow = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: spacing[1] }
  const name = { fontSize: chrome.heroNameSize, lineHeight: chrome.heroNameLine }
  const dot = { width: 8, height: 8, borderRadius: 4, backgroundColor: c.ac }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={heroLabel(unread)} onPress={onPress} style={wrap}>
      <Mascot size={chrome.hero} state={state} color="push" motion={motion} />
      <View style={nameRow}>
        <Text weight="700" style={name}>
          {HERO_NAME}
        </Text>
        {unread ? <View style={dot} /> : null}
      </View>
    </Pressable>
  )
}

export default BotHomeHero

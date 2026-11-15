import { Pressable, View } from 'react-native'
import { Avatar } from '@/features/my'
import { spacing, useColors } from '../../../../theme'
import type { HomeChrome } from './metrics'

const BotHomeHeader = ({
  chrome,
  topInset,
  label,
  name,
  onAccount,
}: {
  chrome: HomeChrome
  topInset: number
  label: string
  name: string
  onAccount: () => void
}) => {
  const c = useColors()
  const bar = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    height: topInset + chrome.header,
    paddingTop: topInset,
    paddingHorizontal: spacing[4],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: c.bg,
  }
  return (
    <View style={bar}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onAccount}>
        <Avatar name={name} size={chrome.avatar} />
      </Pressable>
    </View>
  )
}

export default BotHomeHeader

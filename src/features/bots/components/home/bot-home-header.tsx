import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, View } from 'react-native'
import { Avatar } from '@/features/my'
import { Glass, Icon } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import { NEW_BOT_LABEL } from './copy'
import type { HomeChrome } from './metrics'

const BotHomeHeader = ({
  chrome,
  topInset,
  label,
  name,
  onAccount,
  onNew,
  scrolled,
  hideNew = false,
}: {
  chrome: HomeChrome
  topInset: number
  label: string
  name: string
  onAccount: () => void
  onNew: () => void
  scrolled: boolean
  hideNew?: boolean
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
    justifyContent: 'space-between' as const,
  }
  const face = {
    width: chrome.control,
    height: chrome.control,
    borderRadius: chrome.control / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Platform.OS === 'android' ? c.fill : 'transparent',
  }
  return (
    <View style={bar}>
      {scrolled ? (
        <LinearGradient pointerEvents="none" colors={[`${c.bg}CC`, `${c.bg}00`]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -spacing[3] }} />
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onAccount}>
        <Avatar name={name} size={chrome.avatar} />
      </Pressable>
      {hideNew ? null : (
        <Glass interactive style={face}>
          <Pressable accessibilityRole="button" accessibilityLabel={NEW_BOT_LABEL} onPress={onNew} style={face}>
            <Icon name="plus" size={22} />
          </Pressable>
        </Glass>
      )}
    </View>
  )
}

export default BotHomeHeader

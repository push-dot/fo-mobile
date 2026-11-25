import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Avatar } from '@/features/my'
import { Glass, Icon } from '@/shared/components'
import { useColors } from '../../../../theme'
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
  return (
    <View style={styles.bar(topInset, chrome.header)}>
      {scrolled ? (
        <LinearGradient pointerEvents="none" colors={[`${c.bg}CC`, `${c.bg}00`]} style={styles.fade} />
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onAccount}>
        <Avatar name={name} size={chrome.avatar} />
      </Pressable>
      {hideNew ? null : (
        <Glass interactive style={styles.face(chrome.control)}>
          <Pressable accessibilityRole="button" accessibilityLabel={NEW_BOT_LABEL} onPress={onNew} style={styles.face(chrome.control)}>
            <Icon name="plus" size={22} />
          </Pressable>
        </Glass>
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  bar: (topInset: number, header: number) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    height: topInset + header,
    paddingTop: topInset,
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  fade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -theme.spacing[3] },
  face: (size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'android' ? theme.colors.fill : 'transparent',
  }),
}))

export default BotHomeHeader

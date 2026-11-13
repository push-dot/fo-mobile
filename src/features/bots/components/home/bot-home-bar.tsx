import type { ReactNode } from 'react'
import { Platform, Pressable, TextInput, View } from 'react-native'
import { Glass, Icon, Text } from '@/shared/components'
import { fontFor, spacing, type, useColors } from '../../../../theme'
import { MATERIALS_LABEL, SEARCH_CLOSE, SEARCH_LABEL } from './copy'
import type { HomeChrome } from './metrics'

const BotHomeBar = ({
  chrome,
  lift,
  searching,
  query,
  onSearch,
  onMaterials,
  onChange,
  onClose,
}: {
  chrome: HomeChrome
  lift: number
  searching: boolean
  query: string
  onSearch: () => void
  onMaterials: () => void
  onChange: (value: string) => void
  onClose: () => void
}) => {
  const c = useColors()
  const radius = chrome.control / 2
  const row = {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    bottom: lift,
    zIndex: 5,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: chrome.barGap,
  }
  const face = {
    width: chrome.control,
    height: chrome.control,
    borderRadius: radius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Platform.OS === 'android' ? c.fill : 'transparent',
  }
  const field = {
    flex: 1,
    height: chrome.control,
    borderRadius: radius,
    paddingLeft: spacing[4],
    paddingRight: 6,
    justifyContent: 'center' as const,
    backgroundColor: c.fill,
  }
  const fill = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing[2] }
  const input = { flex: 1, fontSize: chrome.control > 44 ? type.h2.fontSize : type.b1.fontSize, color: c.t1, padding: 0, ...fontFor('400') }
  const hint = { fontSize: chrome.control > 44 ? type.h2.fontSize : type.b1.fontSize, lineHeight: chrome.control > 44 ? 26 : type.b2.lineHeight }
  // AgentHome board: the search field is a flat grey pill (rule 18); only the folder and close buttons are glass.
  const shell = (child: ReactNode) => <View style={field}>{child}</View>
  return (
    <View style={row} pointerEvents="box-none">
      {searching ? null : (
        <Glass interactive style={face}>
          <Pressable accessibilityRole="button" accessibilityLabel={MATERIALS_LABEL} onPress={onMaterials} style={face}>
            <Icon name="folder" size={22} />
          </Pressable>
        </Glass>
      )}
      {searching
        ? shell(
            <View style={fill}>
              <Icon name="search" size={20} color="t3" />
              <TextInput
                autoFocus
                value={query}
                onChangeText={onChange}
                placeholder={SEARCH_LABEL}
                placeholderTextColor={c.t3}
                accessibilityLabel={SEARCH_LABEL}
                style={input}
                returnKeyType="search"
              />
            </View>,
          )
        : shell(
            <Pressable accessibilityRole="button" accessibilityLabel={SEARCH_LABEL} onPress={onSearch} style={fill}>
              <Icon name="search" size={20} color="t3" />
              <Text color="t3" style={hint}>
                {SEARCH_LABEL}
              </Text>
            </Pressable>,
          )}
      {searching ? (
        <Glass interactive style={face}>
          <Pressable accessibilityRole="button" accessibilityLabel={SEARCH_CLOSE} onPress={onClose} style={face}>
            <Icon name="x" size={20} />
          </Pressable>
        </Glass>
      ) : null}
    </View>
  )
}

export default BotHomeBar

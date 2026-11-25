import type { Settings } from '@push/api-client'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform, PlatformColor, Pressable, View } from 'react-native'
import { SETTINGS_PICKS, useSettings, type SettingsPickKind } from '@/features/my'
import { Sheet, Text, WheelPicker } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { useThemePreference, type ThemeChoice } from '@/theme'

const ANDROID = Platform.OS === 'android'

const TextAction = ({ label, bold, onPress }: { label: string; bold?: boolean; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    hitSlop={8}
    style={[styles.action, ANDROID ? styles.actionAndroid : styles.actionIos, !ANDROID && bold && styles.actionIosBold]}
  >
    <Text v={ANDROID ? 'b1' : 'h3'} weight={ANDROID ? (bold ? '700' : '500') : bold ? '600' : '400'} style={ANDROID ? styles.actionLabelAndroid : styles.actionLabelIos}>
      {label}
    </Text>
  </Pressable>
)

const SETTING_KEY = { locale: 'locale', career: 'careerStatusVisibility', contact: 'contactVisibility', tone: 'defaultTone' } as const

const SettingsPickSheetScreen = () => {
  const { kind } = useLocalSearchParams<{ kind: SettingsPickKind }>()
  const { s, set } = useSettings()
  const theme = useThemePreference((state) => state.choice)
  const setTheme = useThemePreference((state) => state.setChoice)
  const pick = SETTINGS_PICKS[kind]
  const current = !pick ? undefined : kind === 'theme' ? theme : s?.[SETTING_KEY[kind]]
  const [draft, setDraft] = useState<string | undefined>(current)
  useEffect(() => {
    if (!pick) router.back()
  }, [pick])
  if (!pick || !s || !current) return null

  const apply = (key: string) => {
    if (key === current) return
    if (kind === 'theme') void setTheme(key as ThemeChoice)
    else set({ [SETTING_KEY[kind]]: key } as Partial<Settings>)
  }
  const items = pick.items.map(({ key, label }) => ({ key, label }))

  const confirm = () => {
    if (draft) apply(draft)
    router.back()
  }
  return (
    <Sheet gap={ANDROID ? undefined : 0} action={ANDROID ? { label: '적용', onPress: confirm } : undefined}>
      {ANDROID ? (
        <Text v="h2" weight="400" accessibilityRole="header" style={styles.androidTitle}>
          {pick.title}
        </Text>
      ) : null}
      {ANDROID ? null : (
        <View style={styles.iosHeader}>
          <View style={styles.iosHeaderSpacer} />
          <Text v="h3" weight="600" accessibilityRole="header">
            {pick.title}
          </Text>
          <TextAction label="적용" bold onPress={confirm} />
        </View>
      )}
      <View style={ANDROID ? undefined : styles.iosPicker}>
        <WheelPicker items={items} value={draft ?? current} onChange={setDraft} accessibilityLabel={pick.title} short />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  action: { minHeight: 44, justifyContent: 'center' },
  actionAndroid: { paddingHorizontal: theme.spacing[1] },
  actionIos: { minWidth: 56, alignItems: 'flex-start' },
  actionIosBold: { alignItems: 'flex-end' },
  actionLabelAndroid: { color: theme.colors.acText },
  actionLabelIos: { color: PlatformColor('systemBlue') },
  androidTitle: { fontSize: 22, lineHeight: theme.type.h2.lineHeight },
  iosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52 },
  iosHeaderSpacer: { minWidth: 56 },
  iosPicker: { marginTop: 6, marginBottom: theme.spacing[5] },
}))

export default SettingsPickSheetScreen

import type { Settings } from '@push/api-client'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform, PlatformColor, Pressable, View } from 'react-native'
import { RadioRow, SETTINGS_PICKS, useSettings, type SettingsPickKind } from '@/features/my'
import { Sheet, Text, WheelPicker } from '@/shared/components'
import { spacing, useColors, useThemePreference, type ThemeChoice } from '@/theme'

const ANDROID = Platform.OS === 'android'

// iOS (.inav .nb): 17 system blue, min 56 wide; 완료 is 600 and sits right, 취소 is 400. Android keeps the accent text button.
const TextAction = ({ label, bold, onPress }: { label: string; bold?: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={{ minHeight: 44, justifyContent: 'center', ...(ANDROID ? { paddingHorizontal: spacing[1] } : { minWidth: 56, alignItems: bold ? 'flex-end' : 'flex-start' }) }}
    >
      <Text v={ANDROID ? 'b1' : 'h3'} weight={ANDROID ? (bold ? '700' : '500') : bold ? '600' : '400'} style={{ color: ANDROID ? c.acText : PlatformColor('systemBlue') }}>
        {label}
      </Text>
    </Pressable>
  )
}

const SETTING_KEY = { locale: 'locale', contact: 'contactVisibility', tone: 'defaultTone' } as const

/**
 * v415 Settings pickers. Language and theme: a wheel in a sheet with 취소 · title · 완료 (iOS) or a radio dialog with 취소 · 확인 (Android);
 * the choice applies on 완료. Contact and tone: a sheet under a question with a radio list, where a tap applies and closes (SettingsStates.3 and .4).
 */
const SettingsPickSheetScreen = () => {
  const { kind } = useLocalSearchParams<{ kind: SettingsPickKind }>()
  const { s, set } = useSettings()
  const theme = useThemePreference((state) => state.choice)
  const setTheme = useThemePreference((state) => state.setChoice)
  const pick = SETTINGS_PICKS[kind]
  const current = !pick ? undefined : kind === 'locale' ? s?.locale : kind === 'theme' ? theme : kind === 'contact' ? s?.contactVisibility : s?.defaultTone
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

  if (!pick.wheel) {
    return (
      <Sheet title={pick.title} gap={spacing[2]}>
        <View accessibilityRole="radiogroup" accessibilityLabel={pick.title}>
          {items.map((it) => (
            <RadioRow
              key={it.key}
              label={it.label}
              on={it.key === current}
              onPress={() => {
                apply(it.key)
                router.back()
              }}
            />
          ))}
        </View>
      </Sheet>
    )
  }

  const confirm = () => {
    if (draft) apply(draft)
    router.back()
  }
  return (
    // iOS SettingsLanguage: the 52pt .inav starts 17 under the sheet top; the wheel follows 6 under it.
    <Sheet title={ANDROID ? pick.title : undefined} gap={ANDROID ? undefined : 0}>
      {ANDROID ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <TextAction label="취소" onPress={() => router.back()} />
          <Text v="h3" weight="600" accessibilityRole="header">
            {pick.title}
          </Text>
          <TextAction label="완료" bold onPress={confirm} />
        </View>
      )}
      {/* .wheels.short: 6 above, 14 below and the sheet's 26 under it (the sheet gives 20), so the sheet is 17+52+6+120+14+26 = 235. */}
      <View style={ANDROID ? undefined : { marginTop: 6, marginBottom: spacing[5] }}>
        <WheelPicker items={items} value={draft ?? current} onChange={setDraft} accessibilityLabel={pick.title} short />
      </View>
      {ANDROID ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2] }}>
          <TextAction label="취소" onPress={() => router.back()} />
          <TextAction label="확인" bold onPress={confirm} />
        </View>
      ) : null}
    </Sheet>
  )
}

export default SettingsPickSheetScreen

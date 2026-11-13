import type { Settings } from '@push/api-client'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { hideCompanyLabel, SETTINGS_PICKS, useMyProfile, useSettings, type SettingsPickKind } from '@/features/my'
import { Sheet, Switch, Text, WheelPicker } from '@/shared/components'
import { spacing, useColors, useThemePreference, type ThemeChoice } from '@/theme'

const ANDROID = Platform.OS === 'android'

const TextAction = ({ label, bold, onPress }: { label: string; bold?: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing[1] }}>
      <Text v="b1" weight={bold ? '700' : '500'} style={{ color: c.acText }}>
        {label}
      </Text>
    </Pressable>
  )
}

/**
 * v412 Settings pickers: iOS opens a wheel in a sheet with 취소 · title · 완료, Android a single-choice list with 취소 · 확인.
 * The choice is applied on 완료, not on every scroll.
 */
const SettingsPickSheetScreen = () => {
  const { kind } = useLocalSearchParams<{ kind: SettingsPickKind }>()
  const { s, set } = useSettings()
  const { data: me } = useMyProfile()
  const theme = useThemePreference((state) => state.choice)
  const setTheme = useThemePreference((state) => state.setChoice)
  const pick = SETTINGS_PICKS[kind]
  const current = !pick ? undefined : kind === 'locale' ? s?.locale : kind === 'theme' ? theme : kind === 'career' ? s?.careerStatusVisibility : kind === 'contact' ? s?.contactVisibility : s?.defaultTone
  const [draft, setDraft] = useState<string | undefined>(current)
  useEffect(() => {
    if (!pick) router.back()
  }, [pick])
  if (!pick || !s || !current) return null

  const confirm = () => {
    if (draft && draft !== current) {
      if (kind === 'theme') void setTheme(draft as ThemeChoice)
      else set({ [{ locale: 'locale', career: 'careerStatusVisibility', contact: 'contactVisibility', tone: 'defaultTone' }[kind]]: draft } as Partial<Settings>)
    }
    router.back()
  }
  const company = me?.careers.find((x) => !x.endedOn)?.company ?? ''
  const items = pick.items.map(({ key, label }) => ({ key, label }))

  return (
    <Sheet title={ANDROID ? pick.title : undefined}>
      {ANDROID ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TextAction label="취소" onPress={() => router.back()} />
          <Text v="h3" accessibilityRole="header">
            {pick.title}
          </Text>
          <TextAction label="완료" bold onPress={confirm} />
        </View>
      )}
      <WheelPicker items={items} value={draft ?? current} onChange={setDraft} accessibilityLabel={pick.title} />
      {kind === 'career' ? (
        <View style={{ gap: spacing[1] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 56 }}>
            <View style={{ flex: 1 }}>
              <Text v="b1">{hideCompanyLabel(company)}</Text>
              <Text v="c1" color="t3">
                같은 회사 이메일로 가입한 사람
              </Text>
            </View>
            <Switch label={hideCompanyLabel(company)} value={s.hideFromCurrentCompany} onValueChange={(v) => set({ hideFromCurrentCompany: v })} />
          </View>
          {s.hideFromCurrentCompany ? (
            <Text v="c1" color="t3">
              지금 다니는 회사 사람에게는 커리어 상태가 보이지 않아요.
            </Text>
          ) : null}
        </View>
      ) : null}
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

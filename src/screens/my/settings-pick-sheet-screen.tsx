import type { Settings } from '@push/api-client'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import { RadioRow, SETTINGS_PICKS, useSettings, type SettingsPickKind } from '@/features/my'
import { Sheet } from '@/shared/components'

const SettingsPickSheetScreen = () => {
  const { kind } = useLocalSearchParams<{ kind: SettingsPickKind }>()
  const { s, set } = useSettings()
  const pick = SETTINGS_PICKS[kind]
  useEffect(() => {
    if (!pick) router.back()
  }, [pick])
  if (!pick) return null
  const current = s?.[pick.field]
  return (
    <Sheet title={pick.title}>
      <View>
        {pick.items.map((it) => (
          <RadioRow
            key={it.key}
            label={it.label}
            on={it.key === current}
            onPress={() => {
              set({ [pick.field]: it.key } as Partial<Settings>)
              router.back()
            }}
          />
        ))}
      </View>
    </Sheet>
  )
}

export default SettingsPickSheetScreen

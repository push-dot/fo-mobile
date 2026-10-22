import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { useMyProfile, useSettings, VISIBILITY } from '@/features/my'
import { Icon, SettingsGroup, SettingsRow, Switch, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const Screen = ({ title, children }: { title: string; children: ReactNode }) => {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={title} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 48, gap: 22 }}
      >
        {children}
      </ScrollView>
    </View>
  )
}

const SettingsVisibilityScreen = () => {
  const { s, set } = useSettings()
  const { data: me } = useMyProfile()
  const company = me?.careers.find((c) => !c.endedOn)?.company ?? '지금 다니는 회사'
  if (!s) {
    return (
      <Screen title="커리어 상태">
        <ActivityIndicator style={{ marginTop: 40 }} />
      </Screen>
    )
  }
  return (
    <Screen title="커리어 상태">
      <View style={{ gap: 0 }}>
        <Text v="b2" color="t3" style={{ paddingHorizontal: 4, paddingBottom: 14 }}>
          ‘이직/구직중’ 같은 커리어 상태를 누가 볼 수 있는지 정해요.
        </Text>
        <SettingsGroup
          note={
            s.hideFromCurrentCompany
              ? '지금 다니는 회사 사람에게는 커리어 상태가 보이지 않아요.'
              : undefined
          }
        >
          {VISIBILITY.map((v) => {
            const on = s.careerStatusVisibility === v.key
            return (
              <Pressable
                key={v.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => set({ careerStatusVisibility: v.key })}
                style={{
                  minHeight: 64,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text v="b1">{v.label}</Text>
                  <Text v="c1" color="t3">
                    {v.sub(me?.followerCount ?? 0)}
                  </Text>
                </View>
                {on ? <Icon name="check" size={20} color="acText" /> : null}
              </Pressable>
            )
          })}
        </SettingsGroup>
      </View>
      <SettingsGroup title="회사 숨기기">
        <SettingsRow
          label={`${company} 사람에게 숨기기`}
          sub="같은 회사 이메일로 가입한 사람"
          right={
            <Switch
              label={`${company} 사람에게 숨기기`}
              value={s.hideFromCurrentCompany}
              onValueChange={(v) => set({ hideFromCurrentCompany: v })}
            />
          }
        />
      </SettingsGroup>
    </Screen>
  )
}

export default SettingsVisibilityScreen

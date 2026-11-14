import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { hideCompanyLabel, useMyFollowers, useMyProfile, useSettings, VISIBILITY } from '@/features/my'
import { Icon, SettingsGroup, SettingsRow, Switch, Text, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

/** SettingsVisibility (v415): 커리어 상태 is its own page again, a radio list with the hide-my-company switch under it. */
const SettingsCareerScreen = () => {
  const c = useColors()
  const { s, set } = useSettings()
  const { data: me } = useMyProfile()
  const followers = useMyFollowers()
  const count = followers.data?.page.total ?? followers.data?.data.length ?? 0
  const company = me?.careers.find((x) => !x.endedOn)?.company ?? ''
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="커리어 상태" onBack={() => router.back()} />
      {s ? (
        <ScrollView contentContainerStyle={{ paddingTop: spacing[1], paddingHorizontal: spacing[5], paddingBottom: 48, gap: 22 }}>
          <SettingsGroup note={s.hideFromCurrentCompany ? '지금 다니는 회사 사람에게는 커리어 상태가 보이지 않아요.' : undefined}>
            {VISIBILITY.map((v) => {
              const on = v.key === s.careerStatusVisibility
              return (
                <Pressable
                  key={v.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => set({ careerStatusVisibility: v.key })}
                  style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] }}
                >
                  <View style={{ flex: 1 }}>
                    <Text v="b1">{v.label}</Text>
                    <Text v="c1" color="t3">
                      {v.sub(count)}
                    </Text>
                  </View>
                  {on ? <Icon name="check" size={20} color="t1" /> : null}
                </Pressable>
              )
            })}
          </SettingsGroup>
          <SettingsGroup title="회사 숨기기">
            <SettingsRow
              label={hideCompanyLabel(company)}
              sub="같은 회사 이메일로 가입한 사람"
              right={<Switch label={hideCompanyLabel(company)} value={s.hideFromCurrentCompany} onValueChange={(v) => set({ hideFromCurrentCompany: v })} />}
            />
          </SettingsGroup>
        </ScrollView>
      ) : null}
    </View>
  )
}

export default SettingsCareerScreen

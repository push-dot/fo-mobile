import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { hideCompanyLabel, useMyFollowers, useMyProfile, useSettings, VISIBILITY } from '@/features/my'
import { SettingsGroup, SettingsRow, Switch, NativeTopBar } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'

const SettingsCareerScreen = () => {
  const { s, set } = useSettings()
  const { data: me } = useMyProfile()
  const followers = useMyFollowers()
  const count = followers.data?.page.total ?? followers.data?.data.length ?? 0
  const current = VISIBILITY.find((v) => v.key === s?.careerStatusVisibility)
  const company = me?.careers.find((x) => !x.endedOn)?.company ?? ''
  return (
    <View style={styles.root}>
      <NativeTopBar title="커리어 상태" onBack={() => router.back()} />
      {s ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SettingsGroup note={current?.sub(count)}>
            <SettingsRow label={current?.label ?? ''} picker onPress={() => router.push({ pathname: '/settings/pick', params: { kind: 'career' } })} />
          </SettingsGroup>
          <SettingsGroup title="회사 숨기기" note={s.hideFromCurrentCompany ? '지금 다니는 회사 사람에게는 커리어 상태가 보이지 않아요.' : undefined}>
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

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingTop: 0, paddingHorizontal: theme.spacing[5], paddingBottom: 48, gap: 22 },
}))

export default SettingsCareerScreen

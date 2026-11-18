import { router } from 'expo-router'
import { Platform, ScrollView, View } from 'react-native'
import { SettingsGroup, SettingsRow, Text, TopBar } from '@/shared/components'
import { companiesTitle, companyNames, useBots } from '@/features/bots'
import { spacing, useColors } from '@/theme'

const BotCompaniesScreen = () => {
  const c = useColors()
  const names = companyNames(useBots().data)
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar circleBack chat={Platform.OS === 'ios'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: spacing[6] }}>
        <Text v="h2" weight="700" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 30, paddingTop: 8, paddingBottom: spacing[3] }}>
          {companiesTitle(names.length)}
        </Text>
        <SettingsGroup>
          {names.map((name) => (
            <SettingsRow key={name} label={name} />
          ))}
        </SettingsGroup>
      </ScrollView>
    </View>
  )
}

export default BotCompaniesScreen

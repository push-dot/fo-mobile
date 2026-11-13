import { router } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { SettingsGroup, SettingsRow, Text, TopBar } from '@/shared/components'
import { companiesTitle, companyNames, useBots } from '@/features/bots'
import { spacing, useColors } from '@/theme'

const BotCompaniesScreen = () => {
  const c = useColors()
  const names = companyNames(useBots().data)
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: spacing[6], gap: spacing[3] }}>
        <Text v="h2" accessibilityRole="header">
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

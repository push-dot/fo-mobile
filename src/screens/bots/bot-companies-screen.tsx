import { router } from 'expo-router'
import { Platform, ScrollView, View } from 'react-native'
import { SettingsGroup, SettingsRow, Text, TopBar } from '@/shared/components'
import { companiesTitle, companyNames, useBots } from '@/features/bots'
import { StyleSheet } from 'react-native-unistyles'

const BotCompaniesScreen = () => {
  const names = companyNames(useBots().data)
  return (
    <View style={styles.screen}>
      <TopBar circleBack chat={Platform.OS === 'ios'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text v="h2" weight="700" accessibilityRole="header" style={styles.title}>
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

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing[5], paddingBottom: theme.spacing[6] },
  title: { fontSize: 22, lineHeight: 30, paddingTop: theme.spacing[2], paddingBottom: theme.spacing[3] },
}))

export default BotCompaniesScreen

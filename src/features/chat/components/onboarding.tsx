import { ScrollView } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { onboardingGreeting } from '../utils/usage'
import BotText from './entries/bot'

const Onboarding = ({
  kind,
  name,
  postingTitle,
  top = 0,
}: {
  kind: 'push' | 'company'
  name: string
  postingTitle?: string | null
  top?: number
}) => (
  <ScrollView contentContainerStyle={styles.content(top)} keyboardShouldPersistTaps="handled">
    <BotText item={{ type: 'agentText', id: 'onboarding', text: onboardingGreeting(kind, name, postingTitle) }} />
  </ScrollView>
)

const styles = StyleSheet.create((theme) => ({
  content: (top: number) => ({ paddingHorizontal: theme.spacing[5], paddingTop: top + theme.spacing[4], paddingBottom: theme.spacing[4] }),
}))

export default Onboarding

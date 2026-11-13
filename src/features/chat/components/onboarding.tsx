import { ScrollView } from 'react-native'
import { spacing } from '../../../theme'
import { onboardingGreeting } from '../utils/usage'
import BotText from './entries/bot'

/** The first screen is the greeting bubble; the quick starts sit above the input (QuickStartRow). */
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
  <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], paddingTop: top + spacing[4], paddingBottom: spacing[4] }} keyboardShouldPersistTaps="handled">
    <BotText item={{ type: 'agentText', id: 'onboarding', text: onboardingGreeting(kind, name, postingTitle) }} />
  </ScrollView>
)

export default Onboarding

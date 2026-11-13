import { ScrollView, View } from 'react-native'
import { Chip, Text } from '@/shared/components'
import { spacing } from '../../../theme'
import { QUICK_STARTS } from '../constants'
import { onboardingGreeting } from '../utils/usage'

const COMPANY_CHIP_KEYS = ['fit', 'gap', 'boost', 'exp'] as const

const chipsFor = (kind: 'push' | 'company') =>
  kind === 'push'
    ? QUICK_STARTS
    : COMPANY_CHIP_KEYS.flatMap((key) => {
        const row = QUICK_STARTS.find((item) => item.key === key)
        return row ? [row] : []
      })

const Onboarding = ({
  kind,
  name,
  postingTitle,
  onChip,
  top = 0,
}: {
  kind: 'push' | 'company'
  name: string
  postingTitle?: string | null
  onChip: (key: string) => void
  top?: number
}) => (
  <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], paddingTop: top + spacing[4], paddingBottom: spacing[4], gap: spacing[4] }} keyboardShouldPersistTaps="handled">
    <Text v="b1">
      {onboardingGreeting(kind, name, postingTitle)}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
      {chipsFor(kind).map((item) => (
        <Chip key={item.key} label={item.label} onPress={() => onChip(item.key)} />
      ))}
    </View>
  </ScrollView>
)

export default Onboarding

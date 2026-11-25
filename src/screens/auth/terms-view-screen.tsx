import { ScrollView, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LegalDocument, TERMS_AGREE, TERM_DOCUMENTS, TERM_ROWS, isTermKey, useTermsConsent } from '@/features/auth'
import { Button, CtaBar, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const CTA_CLEARANCE = 120
const NO_CTA_CLEARANCE = spacing[6]

const TermsViewScreen = () => {
  const c = useColors()
  const { term } = useLocalSearchParams<{ term?: string }>()
  const agree = useTermsConsent((state) => state.agree)
  const insets = useSafeAreaInsets()
  if (!isTermKey(term))
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
      </View>
    )

  const hasCta = TERM_ROWS.some((row) => row.id === term)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[6], paddingTop: spacing[2], paddingBottom: hasCta ? CTA_CLEARANCE : NO_CTA_CLEARANCE + insets.bottom, gap: spacing[6] }}>
        <LegalDocument document={TERM_DOCUMENTS[term]} />
      </ScrollView>
      {hasCta ? (
        <CtaBar>
          <Button
            label={TERMS_AGREE}
            onPress={() => {
              agree(term)
              router.back()
            }}
            style={{ flex: 1 }}
          />
        </CtaBar>
      ) : null}
    </View>
  )
}

export default TermsViewScreen

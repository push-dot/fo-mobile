import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { LegalDocument, TERMS_AGREE, TERM_DOCUMENTS, TERM_ROWS, isTermKey, useTermsConsent } from '@/features/auth'
import { Button, CtaBar, TopBar } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '@/theme'

const CTA_CLEARANCE = 120
const NO_CTA_CLEARANCE = spacing[6]

const TermsViewScreen = () => {
  const { term } = useLocalSearchParams<{ term?: string }>()
  const agree = useTermsConsent((state) => state.agree)
  const insets = useSafeAreaInsets()
  if (!isTermKey(term))
    return (
      <View style={styles.screen}>
        <TopBar onBack={() => router.back()} />
      </View>
    )

  const hasCta = TERM_ROWS.some((row) => row.id === term)

  return (
    <View style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content(hasCta, insets.bottom)}>
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
            style={styles.flex}
          />
        </CtaBar>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: (hasCta: boolean, bottom: number) => ({
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[2],
    paddingBottom: hasCta ? CTA_CLEARANCE : NO_CTA_CLEARANCE + bottom,
    gap: theme.spacing[6],
  }),
  flex: { flex: 1 },
}))

export default TermsViewScreen

import { ScrollView, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { TERMS_AGREE, TERMS_TEXT, isTermKey, useTermsConsent } from '@/features/auth'
import { Button, CtaBar, Text, TopBar } from '@/shared/components'
import { radius, spacing, type, useColors } from '@/theme'

const CTA_CLEARANCE = 120
const TITLE_GAP = 6
const TITLE_SIZE = { fontSize: 24, lineHeight: 32 }
const NOTICE_PADDING = 14

const TermsViewScreen = () => {
  const c = useColors()
  const { term } = useLocalSearchParams<{ term?: string }>()
  const agree = useTermsConsent((state) => state.agree)
  if (!isTermKey(term))
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
      </View>
    )
  const text = TERMS_TEXT[term]

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[6], paddingTop: spacing[2], paddingBottom: CTA_CLEARANCE, gap: spacing[6] }}>
        <View style={{ gap: TITLE_GAP }}>
          <Text accessibilityRole="header" v="h1" style={TITLE_SIZE}>
            {text.title}
          </Text>
          <Text v="c1" color="t3">
            {text.effective}
          </Text>
        </View>
        <View style={{ paddingVertical: NOTICE_PADDING, paddingHorizontal: spacing[4], borderRadius: radius.md, backgroundColor: c.bg2 }}>
          <Text v="c1" color="t2">
            {text.notice}
          </Text>
        </View>
        {text.sections.map((section) => (
          <View key={section.heading} style={{ gap: spacing[2] }}>
            <Text v="h3" accessibilityRole="header">
              {section.heading}
            </Text>
            <Text v="b2" color="t2" style={{ lineHeight: type.b1.lineHeight }}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
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
    </View>
  )
}

export default TermsViewScreen

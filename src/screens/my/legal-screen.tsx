import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { LEGAL_DOCUMENTS } from '@push/shared'
import { LEGAL_TABS, LEGAL_TITLE, LegalDocument, type LegalTab } from '@/features/auth'
import { SegmentedControl, TopBar } from '@/shared/components'
import { HIT_TARGET, spacing, useColors } from '@/theme'

const LegalScreen = () => {
  const c = useColors()
  const [tab, setTab] = useState<LegalTab>('termsOfService')
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={LEGAL_TITLE} onBack={() => router.back()} />
      <View style={{ paddingTop: spacing[1], paddingHorizontal: spacing[5] }}>
        <SegmentedControl items={LEGAL_TABS} value={tab} onChange={setTab} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[6], paddingTop: spacing[6], paddingBottom: HIT_TARGET, gap: spacing[6] }}>
        <LegalDocument document={LEGAL_DOCUMENTS[tab]} />
      </ScrollView>
    </View>
  )
}

export default LegalScreen

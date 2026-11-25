import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { APP_LEGAL_DOCUMENTS, LEGAL_TABS, LEGAL_TITLE, LegalDocument, type LegalTab } from '@/features/auth'
import { SegmentedControl, NativeTopBar } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { HIT_TARGET } from '@/theme'

const LegalScreen = () => {
  const [tab, setTab] = useState<LegalTab>('termsOfService')
  return (
    <View style={styles.root}>
      <NativeTopBar title={LEGAL_TITLE} onBack={() => router.back()} />
      <View style={styles.tabs}>
        <SegmentedControl items={LEGAL_TABS} value={tab} onChange={setTab} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <LegalDocument document={APP_LEGAL_DOCUMENTS[tab]} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  tabs: { paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[5] },
  content: { paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[4], paddingBottom: HIT_TARGET, gap: theme.spacing[6] },
}))

export default LegalScreen

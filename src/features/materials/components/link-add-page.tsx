import type { LinkKind } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { fullLinkUrl, LINK_KIND_LABEL, kindOf } from '@/features/chat'
import { useAddLink } from '@/features/my'
import { Chip, PM8, PM8_MDET_HEAD, Sheet, SheetScroll, Text, TextField, useSheetScrollMax } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '@/theme'
import { useRefreshMaterials } from '../api/hooks'
import { LINK_ADD } from '../constants'

const KIND_CHIP = { padding: spacing[3], height: 36 }
const KIND_GAP = 6
const KINDS = Object.keys(LINK_KIND_LABEL) as LinkKind[]

export const MaterialLinkAddPage = () => {
  const refresh = useRefreshMaterials()
  const [url, setUrl] = useState('')
  const [picked, setPicked] = useState<LinkKind | null>(null)
  const kind = picked ?? (url.trim() ? kindOf(url) : null)
  const full = fullLinkUrl(url, picked)
  const valid = /^https?:\/\/[^\s@/]+\.[^\s@]+$/.test(full)
  const bound = useSheetScrollMax()
  const add = useAddLink(() => {
    refresh()
    router.back()
  })
  return (
    <Sheet gap={PM8.gap} topGap={PM8.topGap} actionGap={PM8.actionGap} bottomExtra={PM8.bottomExtra} slimAction onLayout={bound.onSheetLayout} action={{ label: LINK_ADD.submit, onPress: () => add.mutate({ url: full, kind: kind ?? undefined, aiRead: true }), disabled: !valid || add.isPending, pending: add.isPending }}>
      <View style={styles.head}>
        <Text v="h3" weight="600" accessibilityRole="header" style={styles.title}>
          {LINK_ADD.title}
        </Text>
      </View>
      <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <TextField icon="link" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" minHeight={54} autoFocus accessibilityLabel="링크 주소" />
        <View style={styles.kinds}>
          {KINDS.map((k) => (
            <Chip key={k} label={LINK_KIND_LABEL[k]} on={kind === k} fit={KIND_CHIP} onPress={() => setPicked(k)} />
          ))}
        </View>
      </SheetScroll>
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: { minHeight: PM8_MDET_HEAD.minHeight, justifyContent: 'center' },
  title: { textAlign: 'center' },
  scroll: (maxHeight: number) => ({ maxHeight }),
  content: { gap: theme.spacing[3] },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: KIND_GAP },
}))

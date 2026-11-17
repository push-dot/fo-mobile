import type { LinkKind } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { fullLinkUrl, LINK_KIND_LABEL, kindOf } from '@/features/chat'
import { useAddLink } from '@/features/my'
import { Chip, Sheet, SheetScroll, Text, TextField, useSheetScrollMax } from '@/shared/components'
import { spacing } from '@/theme'
import { useRefreshMaterials } from '../api/hooks'
import { LINK_ADD } from '../constants'

const KIND_CHIP = { padding: spacing[3], height: 36 }
const KIND_GAP = 6
const KINDS = Object.keys(LINK_KIND_LABEL) as LinkKind[]

/** MaterialsLinkAdd: a regular sheet over the 자료 modal with the five kinds. LinkedIn is not one: the list marks it from the host. */
export const MaterialLinkAddPage = () => {
  const refresh = useRefreshMaterials()
  const [url, setUrl] = useState('')
  const [picked, setPicked] = useState<LinkKind | null>(null)
  const kind = picked ?? (url.trim() ? kindOf(url) : null)
  const full = fullLinkUrl(url, picked)
  const valid = /^https?:\/\/[^\s@/]+\.[^\s@]+$/.test(full)
  const bound = useSheetScrollMax(0.55)
  const add = useAddLink(() => {
    refresh()
    router.back()
  })
  return (
    <Sheet onLayout={bound.onSheetLayout} action={{ label: LINK_ADD.submit, onPress: () => add.mutate({ url: full, kind: kind ?? undefined, aiRead: true }), disabled: !valid || add.isPending, pending: add.isPending }}>
      <Text v="h3" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {LINK_ADD.title}
      </Text>
      <SheetScroll style={{ maxHeight: bound.maxHeight }} onLayout={bound.onScrollLayout} contentContainerStyle={{ gap: spacing[3] }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <TextField icon="link" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" minHeight={54} autoFocus accessibilityLabel="링크 주소" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIND_GAP }}>
          {KINDS.map((k) => (
            <Chip key={k} label={LINK_KIND_LABEL[k]} on={kind === k} fit={KIND_CHIP} onPress={() => setPicked(k)} />
          ))}
        </View>
      </SheetScroll>
    </Sheet>
  )
}

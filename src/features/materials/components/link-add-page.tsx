import type { LinkKind } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { fullLinkUrl, LINK_KIND_LABEL, kindOf } from '@/features/chat'
import { useAddLink } from '@/features/my'
import { Chip, Sheet, Text, TextField } from '@/shared/components'
import { spacing } from '@/theme'
import { useRefreshMaterials } from '../api/hooks'
import { LINK_ADD } from '../constants'

const KINDS = Object.keys(LINK_KIND_LABEL) as LinkKind[]

/** MaterialsLinkAdd: a regular sheet over the 자료 modal with the five kinds. LinkedIn is not one: the list marks it from the host. */
export const MaterialLinkAddPage = () => {
  const refresh = useRefreshMaterials()
  const [url, setUrl] = useState('')
  const [picked, setPicked] = useState<LinkKind | null>(null)
  const kind = picked ?? (url.trim() ? kindOf(url) : null)
  const full = fullLinkUrl(url, picked)
  const valid = /^https?:\/\/[^\s@/]+\.[^\s@]+$/.test(full)
  const add = useAddLink(() => {
    refresh()
    router.back()
  })
  return (
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Sheet action={{ label: LINK_ADD.submit, onPress: () => add.mutate({ url: full, kind: kind ?? undefined, aiRead: true }), disabled: !valid || add.isPending, pending: add.isPending }}>
        <Text v="h3" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {LINK_ADD.title}
        </Text>
        <TextField icon="link" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" minHeight={54} autoFocus accessibilityLabel="링크 주소" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {KINDS.map((k) => (
            <Chip key={k} label={LINK_KIND_LABEL[k]} on={kind === k} onPress={() => setPicked(k)} />
          ))}
        </View>
      </Sheet>
    </ScrollView>
  )
}

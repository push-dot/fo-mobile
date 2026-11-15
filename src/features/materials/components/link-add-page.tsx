import type { LinkKind } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { fullLinkUrl, LINK_KIND_LABEL, PageModal, kindOf } from '@/features/chat'
import { useAddLink } from '@/features/my'
import { Button, Chip, GlassButton, Switch, Text, TextField } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'
import { useRefreshMaterials } from '../api/hooks'
import { LINK_ADD } from '../constants'

const KINDS = Object.keys(LINK_KIND_LABEL) as LinkKind[]

/** MaterialsLinkAdd: a page inside the 자료 modal with the five kinds. LinkedIn is not one: the list marks it from the host. */
export const MaterialLinkAddPage = () => {
  const c = useColors()
  const refresh = useRefreshMaterials()
  const [url, setUrl] = useState('')
  const [picked, setPicked] = useState<LinkKind | null>(null)
  const [aiRead, setAiRead] = useState(true)
  const kind = picked ?? (url.trim() ? kindOf(url) : null)
  const full = fullLinkUrl(url, picked)
  const valid = /^https?:\/\/[^\s@/]+\.[^\s@]+$/.test(full)
  const add = useAddLink(() => {
    refresh()
    router.back()
  })
  return (
    <PageModal
      title={LINK_ADD.title}
      mpage
      left={<GlassButton circle iconSize={20} actions={[{ icon: 'back', label: '뒤로', onPress: () => router.back() }]} />}
      footer={<Button label={LINK_ADD.submit} onPress={() => add.mutate({ url: full, kind: kind ?? undefined, aiRead })} disabled={!valid || add.isPending} />}
    >
      <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[3], gap: spacing[4] }}>
        <Text v="b2" color="t3">
          {LINK_ADD.hint}
        </Text>
        <TextField placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" minHeight={54} autoFocus accessibilityLabel="링크 주소" />
        <View style={{ gap: spacing[2] }}>
          <Text v="c1" weight="700" color="t3">
            {LINK_ADD.kind}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {KINDS.map((k) => (
              <Chip key={k} label={LINK_KIND_LABEL[k]} on={kind === k} onPress={() => setPicked(k)} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}>
          <Text v="b2" style={{ flex: 1 }}>
            {LINK_ADD.note}
          </Text>
          <Switch value={aiRead} onValueChange={setAiRead} label={LINK_ADD.note} />
        </View>
      </View>
    </PageModal>
  )
}

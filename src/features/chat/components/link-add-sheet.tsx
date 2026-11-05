import type { LinkKind } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { radius, spacing, useColors } from '@/theme'
import { Chip, Icon, Sheet, Switch, Text, TextField } from '@/shared/components'
import { useAddLink } from '@/features/my'
import { LINK_ADD_NOTE } from '../constants'
import { LINK_KIND_LABEL, kindOf } from '../utils/links'


export const LinkAddSheet = () => {
  const c = useColors()
  const [url, setUrl] = useState('')
  const [picked, setPicked] = useState<LinkKind | null>(null)
  const [aiRead, setAiRead] = useState(true)
  const kind = picked ?? (url.trim() ? kindOf(url) : null)
  const full = /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`
  const valid = /^https?:\/\/[^\s@/]+\.[^\s@]+$/.test(full)
  const add = useAddLink(() => router.back())
  return (
    <Sheet
      title="링크 추가"
      description="링크를 붙여넣으면 종류를 알아서 골라요."
      action={{ label: '추가하기', onPress: () => add.mutate({ url: full, kind: kind ?? undefined, aiRead }), disabled: !valid || add.isPending }}
    >
      <TextField icon="link" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" autoFocus accessibilityLabel="링크 주소" />
      <View style={{ gap: spacing[2] }}>
        <Text v="c1" weight="700" color="t3">
          종류
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {(Object.keys(LINK_KIND_LABEL) as LinkKind[]).map((k) => (
            <Chip key={k} label={LINK_KIND_LABEL[k]} on={kind === k} onPress={() => setPicked(k)} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}>
        <Icon name="spark" size={20} color="acText" />
        <Text v="b2" style={{ flex: 1 }}>
          {LINK_ADD_NOTE}
        </Text>
        <Switch value={aiRead} onValueChange={setAiRead} label={LINK_ADD_NOTE} />
      </View>
    </Sheet>
  )
}

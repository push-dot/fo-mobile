import { CAREER_STATUSES } from '@push/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, Share, View } from 'react-native'
import { api } from '../../lib/api'
import { WEB_BASE_URL } from '../../lib/config'
import { useSession } from '../../lib/session'
import { useColors } from '../../theme'
import { Glass, Icon, Text, TopBar } from '../../ui'
import { careerLine } from '../hub/filters'
import { ProposalSheet } from '../hub/ProposalSheet'
import { DetailWebView } from './DetailWebView'

/** 허브 프로필 상세 (feature-spec 10): fo-web body + 팔로우 · 공유 · 제안하기 capsule. */
export function ProfileDetailScreen({ id }: { id: string }) {
  const c = useColors()
  const qc = useQueryClient()
  const me = useSession((s) => s.session?.user.id)
  const [title, setTitle] = useState<string>()
  const [proposing, setProposing] = useState(false)
  const key = ['profiles', 'detail', id]
  const { data: p } = useQuery({ queryKey: key, queryFn: () => api.profiles.get(id) })
  const follow = useMutation({
    mutationFn: (on: boolean) => (on ? api.profiles.follow(id) : api.profiles.unfollow(id)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
  const following = follow.isPending ? follow.variables : !!p?.following
  const self = me === id
  const subtitle = p
    ? [
        careerLine(p),
        CAREER_STATUSES.find((s) => s.key === p.careerStatus)?.label,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  // 팔로우 is a text action, which GlassButton (icon-only) doesn't cover.
  const actions = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
      {self ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: following, disabled: !p }}
          disabled={!p}
          onPress={() => follow.mutate(!following)}
          style={{ height: 44, minWidth: 40, paddingHorizontal: 10, justifyContent: 'center' }}
        >
          <Text v="b2" weight="700" style={{ color: following ? c.t3 : c.acText }}>
            {following ? '팔로잉' : '팔로우'}
          </Text>
        </Pressable>
      )}
      <Action icon="share" label="공유" onPress={() => void Share.share({ message: `${p ? `${p.displayName} · ${p.headline}\n` : ''}${WEB_BASE_URL}/profiles/${id}` })} />
      {self ? null : <Action icon="paper" label="제안하기" onPress={() => p && setProposing(true)} />}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title={title}
        onBack={() => router.back()}
        right={Platform.OS === 'ios' ? <Glass interactive style={{ borderRadius: 22, height: 44, justifyContent: 'center' }}>{actions}</Glass> : actions}
      />
      <DetailWebView path={`/profiles/${encodeURIComponent(id)}`} onTitle={setTitle} />
      {p ? (
        <ProposalSheet
          userId={id}
          name={p.displayName}
          subtitle={subtitle}
          visible={proposing}
          onClose={() => setProposing(false)}
          onSent={() => {
            setProposing(false)
            void qc.invalidateQueries({ queryKey: key })
          }}
        />
      ) : null}
    </View>
  )
}

function Action({ icon, label, onPress }: { icon: 'share' | 'paper'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={{ height: 44, minWidth: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={22} />
    </Pressable>
  )
}

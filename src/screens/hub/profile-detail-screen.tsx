import { CAREER_STATUSES } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, Share, View } from 'react-native'
import {
  ProfileAction,
  ProposalSheet,
  careerLine,
  profileShareMessage,
  useFollow,
  useInvalidateProfileDetail,
  useProfile,
  useViewerId,
} from '@/features/hub'
import { DetailWebView, Glass, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const ProfileDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const me = useViewerId()
  const [title, setTitle] = useState<string>()
  const [proposing, setProposing] = useState(false)
  const { data: p } = useProfile(id)
  const follow = useFollow(id)
  const invalidateDetail = useInvalidateProfileDetail(id)
  const following = follow.isPending ? follow.variables : !!p?.following
  const self = me === id
  const subtitle = p
    ? [careerLine(p), CAREER_STATUSES.find((s) => s.key === p.careerStatus)?.label].filter(Boolean).join(' · ')
    : ''

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
      <ProfileAction icon="share" label="공유" onPress={() => void Share.share({ message: profileShareMessage(id, p) })} />
      {self ? null : <ProfileAction icon="paper" label="제안하기" onPress={() => p && setProposing(true)} />}
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
            void invalidateDetail()
          }}
        />
      ) : null}
    </View>
  )
}

export default ProfileDetailScreen

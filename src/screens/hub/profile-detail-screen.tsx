import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { ProfileAction, profileShareMessage, useFollow, useProfile, useViewerId } from '@/features/hub'
import { DetailWebView, Glass, Text, TopBar } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { spacing, useColors } from '@/theme'

const ProfileDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const me = useViewerId()
  const [title, setTitle] = useState<string>()
  const { data: p } = useProfile(id)
  const follow = useFollow(id)
  const following = follow.isPending ? follow.variables : !!p?.following
  const self = me === id

  const actions = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[1] }}>
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
      <ProfileAction icon="share" label="공유" onPress={() => void shareMessage({ message: profileShareMessage(id, p) })} />
      {self ? null : <ProfileAction icon="paper" label="제안하기" onPress={() => router.push({ pathname: '/proposal', params: { userId: id } })} />}
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
    </View>
  )
}

export default ProfileDetailScreen

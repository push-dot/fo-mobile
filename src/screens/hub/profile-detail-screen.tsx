import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShareFile } from '@/features/chat'
import { ProfileTab, useMyProfile } from '@/features/my'
import { ProfileAction, profileShareMessage, useFollow, useProfile, useViewerId } from '@/features/hub'
import { DetailWebView, FloatingHeader, Glass, Text, TopBar, useFloatingHeader, type DetailFrom } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { spacing, useColors } from '@/theme'

const OwnProfile = () => {
  const { data: me } = useMyProfile()
  const share = useShareFile()
  return <ProfileTab share={false} exporting={share.isPending} onExport={me ? () => share.mutate({ profile: true, name: me.displayName, photo: !!me.avatarUrl }) : undefined} />
}

const ProfileDetailScreen = ({ id, from }: { id: string; from?: DetailFrom }) => {
  const c = useColors()
  const me = useViewerId()
  const { data: p } = useProfile(id)
  const follow = useFollow(id)
  const following = follow.isPending ? follow.variables : !!p?.following
  const self = me === id
  const { onHeight, inset } = useFloatingHeader()
  const [offset, setOffset] = useState(0)
  const { top } = useSafeAreaInsets()

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
          <Text v="b2" weight="700" style={{ color: following ? c.t3 : c.t1 }}>
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
      {self ? null : <DetailWebView path={`/profiles/${encodeURIComponent(id)}`} from={from} inset={{ top: inset + top, bottom: 0 }} onScroll={setOffset} />}
      <FloatingHeader scrolled={offset > 0} onHeight={onHeight}>
        <TopBar
          transparent
          onBack={() => router.back()}
          right={Platform.OS === 'ios' ? <Glass interactive style={{ borderRadius: 22, height: 44, justifyContent: 'center' }}>{actions}</Glass> : actions}
        />
      </FloatingHeader>
      {self ? (
        <ScrollView contentContainerStyle={{ paddingTop: inset + top, paddingBottom: spacing[6] }}>
          <OwnProfile />
        </ScrollView>
      ) : null}
    </View>
  )
}

export default ProfileDetailScreen

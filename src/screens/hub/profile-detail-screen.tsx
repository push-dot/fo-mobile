import { router } from 'expo-router'
import { Platform, Pressable, ScrollView, View } from 'react-native'
import { ProfileTab } from '@/features/my'
import { ProfileAction, profileShareMessage, useFollow, useProfile, useViewerId } from '@/features/hub'
import { DetailWebView, Glass, Text, TopBar, type DetailFrom } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { spacing, useColors } from '@/theme'

const ProfileDetailScreen = ({ id, from }: { id: string; from?: DetailFrom }) => {
  const c = useColors()
  const me = useViewerId()
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
      <TopBar
        onBack={() => router.back()}
        right={Platform.OS === 'ios' ? <Glass interactive style={{ borderRadius: 22, height: 44, justifyContent: 'center' }}>{actions}</Glass> : actions}
      />
      {self ? (
        // ProfileDetailMe: the own profile is MyProfile's page, edited section by section like the 마이 edit pages.
        <ScrollView contentContainerStyle={{ paddingBottom: spacing[6] }}>
          <ProfileTab share={false} />
        </ScrollView>
      ) : (
        <DetailWebView path={`/profiles/${encodeURIComponent(id)}`} from={from} />
      )}
    </View>
  )
}

export default ProfileDetailScreen

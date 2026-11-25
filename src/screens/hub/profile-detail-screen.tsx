import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShareFile } from '@/features/chat'
import { ProfileTab, useMyProfile } from '@/features/my'
import { ProfileAction, profileShareMessage, useFollow, useProfile, useViewerId } from '@/features/hub'
import { DetailWebView, FloatingHeader, Glass, Text, TopBar, useFloatingHeader, type DetailFrom } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { StyleSheet } from 'react-native-unistyles'

const OwnProfile = () => {
  const { data: me } = useMyProfile()
  const share = useShareFile()
  return <ProfileTab share={false} exporting={share.isPending} onExport={me ? () => share.mutate({ profile: true, name: me.displayName, photo: !!me.avatarUrl }) : undefined} />
}

const ProfileDetailScreen = ({ id, from }: { id: string; from?: DetailFrom }) => {
  const me = useViewerId()
  const { data: p } = useProfile(id)
  const follow = useFollow(id)
  const following = follow.isPending ? follow.variables : !!p?.following
  const self = me === id
  const { onHeight, inset } = useFloatingHeader()
  const [offset, setOffset] = useState(0)
  const { top } = useSafeAreaInsets()

  const actions = (
    <View style={styles.actions}>
      {self ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: following, disabled: !p }}
          disabled={!p}
          onPress={() => follow.mutate(!following)}
          style={styles.follow}
        >
          <Text v="b2" weight="700" style={following ? styles.following : styles.followLabel}>
            {following ? '팔로잉' : '팔로우'}
          </Text>
        </Pressable>
      )}
      <ProfileAction icon="share" label="공유" onPress={() => void shareMessage({ message: profileShareMessage(id, p) })} />
      {self ? null : <ProfileAction icon="paper" label="제안하기" onPress={() => router.push({ pathname: '/proposal', params: { userId: id } })} />}
    </View>
  )

  return (
    <View style={styles.screen}>
      {self ? null : <DetailWebView path={`/profiles/${encodeURIComponent(id)}`} from={from} inset={{ top: inset + top, bottom: 0 }} onScroll={setOffset} />}
      <FloatingHeader scrolled={offset > 0} onHeight={onHeight}>
        <TopBar
          transparent
          onBack={() => router.back()}
          right={Platform.OS === 'ios' ? <Glass interactive style={styles.glass}>{actions}</Glass> : actions}
        />
      </FloatingHeader>
      {self ? (
        <ScrollView contentContainerStyle={styles.own(inset + top)}>
          <OwnProfile />
        </ScrollView>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing[1] },
  follow: { height: 44, minWidth: 40, paddingHorizontal: 10, justifyContent: 'center' },
  followLabel: { color: theme.colors.t1 },
  following: { color: theme.colors.t3 },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  glass: { borderRadius: 22, height: 44, justifyContent: 'center' },
  own: (paddingTop: number) => ({ paddingTop, paddingBottom: theme.spacing[6] }),
}))

export default ProfileDetailScreen

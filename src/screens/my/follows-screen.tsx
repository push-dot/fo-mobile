import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native'
import { Avatar, followMatches, Row, useMyFollowers, useMyFollows } from '@/features/my'
import { Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const FollowsScreen = () => {
  const c = useColors()
  const { box } = useLocalSearchParams<{ box?: string }>()
  const following = box !== 'followers'
  const [q, setQ] = useState('')
  const mine = useMyFollows()
  const fans = useMyFollowers()
  const query = following ? mine : fans
  // shortcut: filters the first page only; page the search when the list grows past 50.
  const people = followMatches(query.data?.data ?? [], following ? q : '')
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={following ? '팔로잉' : '팔로워'} onBack={() => router.back()} />
      {following ? (
        <TextInput
          accessibilityLabel="이름이나 직무로 찾기"
          value={q}
          onChangeText={setQ}
          placeholder="이름이나 직무로 찾기"
          placeholderTextColor={c.t4}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            height: 44,
            borderRadius: 12,
            backgroundColor: c.fill,
            paddingHorizontal: 14,
            color: c.t1,
          }}
        />
      ) : null}
      {query.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView>
          {people.map((p) => (
            <Row key={p.userId} label={p.displayName} onPress={() => router.push(`/profiles/${p.userId}`)}>
              <Avatar name={p.displayName} url={p.avatarUrl} />
              <View style={{ flex: 1 }}>
                <Text v="b1" weight="700">
                  {p.displayName}
                </Text>
                <Text v="c1" color="t3" numberOfLines={1}>
                  {p.headline}
                </Text>
              </View>
            </Row>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default FollowsScreen

import { router, useLocalSearchParams } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { Avatar, Empty, emptyCta, followMatches, ListSkeleton, PersonRow, Row, useMyFollowers, useMyFollows } from '@/features/my'
import { GlassField, Icon, Text, TopBar } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { useXlChrome } from '@/shared/components/xl-chrome'
import { fontFor, radius, spacing, type, useColors } from '@/theme'


const FollowsScreen = () => {
  const c = useColors()
  const { button } = useXlChrome()
  const { box } = useLocalSearchParams<{ box?: string }>()
  const following = box !== 'followers'
  const [q, setQ] = useState('')
  const mine = useMyFollows()
  const fans = useMyFollowers()
  const query = following ? mine : fans
  // shortcut: filters the first page only; page the search when the list grows past 50.
  const people = followMatches(query.data?.data ?? [], following ? q : '')
  const renderItem = ({ item: p }: { item: (typeof people)[number] }) =>
      following ? (
        <PersonRow p={p} known />
      ) : (
        <Row label={p.displayName} onPress={() => router.push(`/profiles/${p.userId}`)}>
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
      )
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={following ? '팔로잉' : '팔로워'} onBack={() => router.back()} right={<View style={{ width: button }} />} />
      {following ? (
        <GlassField
          style={{
            marginHorizontal: spacing[5],
            marginVertical: spacing[2],
            height: 44,
            borderRadius: radius.pill,
            paddingHorizontal: spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <Icon name="search" size={18} color="t3" />
          <TextInput
            accessibilityLabel="이름이나 직무로 찾기"
            value={q}
            onChangeText={setQ}
            placeholder="이름이나 직무로 찾기"
            placeholderTextColor={c.t4}
            style={[{ flex: 1, fontSize: type.b2.fontSize, color: c.t1, ...inputReset }, fontFor('400')]}
          />
        </GlassField>
      ) : null}
      {query.isLoading ? (
        <ListSkeleton />
      ) : (
        <LegendList
          data={people}
          keyExtractor={(p) => p.userId}
          renderItem={renderItem}
          estimatedItemSize={72}
          extraData={following}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          ListHeaderComponent={
            <Text v="c1" weight="600" color="t2" style={{ paddingTop: spacing[2], paddingBottom: spacing[1], paddingHorizontal: spacing[5] }}>
              {query.data?.page.total ?? people.length}명
            </Text>
          }
          ListEmptyComponent={
            following ? (
              <Empty
                text={emptyCta('follows').title}
                action={q ? undefined : emptyCta('follows').action}
                onAction={() => router.push(emptyCta('follows').href)}
              />
            ) : null
          }
        />
      )}
    </View>
  )
}

export default FollowsScreen

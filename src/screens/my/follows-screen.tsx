import { router, useLocalSearchParams } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import {
  Avatar,
  Empty,
  emptyCta,
  followMatches,
  ListSkeleton,
  PersonRow,
  Row,
  useMyFollowers,
  useMyFollows,
} from '@/features/my'
import { GlassField, Icon, Text, NativeTopBar } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { useXlChrome } from '@/shared/components/xl-chrome'
import { StyleSheet } from 'react-native-unistyles'
import { fontFor, useColors } from '@/theme'

const FollowsScreen = () => {
  const c = useColors()
  const { button } = useXlChrome()
  const { box } = useLocalSearchParams<{ box?: string }>()
  const following = box !== 'followers'
  const [q, setQ] = useState('')
  const mine = useMyFollows(following)
  const fans = useMyFollowers(!following)
  const query = following ? mine : fans
  const people = followMatches(query.data?.data ?? [], following ? q : '')
  const renderItem = ({ item: p }: { item: (typeof people)[number] }) =>
    following ? (
      <PersonRow p={p} known />
    ) : (
      <Row label={p.displayName} onPress={() => router.push(`/profiles/${p.userId}`)}>
        <Avatar name={p.displayName} url={p.avatarUrl} />
        <View style={styles.personText}>
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
    <View style={styles.screen}>
      <NativeTopBar
        title={following ? '팔로잉' : '팔로워'}
        onBack={() => router.back()}
        right={<View style={styles.spacer(button)} />}
      />
      {following ? (
        <GlassField style={styles.search}>
          <Icon name="search" size={18} color="t3" />
          <TextInput
            accessibilityLabel="이름이나 직무로 찾기"
            value={q}
            onChangeText={setQ}
            placeholder="이름이나 직무로 찾기"
            placeholderTextColor={c.t4}
            style={styles.input}
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
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text v="c1" weight="600" color="t2" style={styles.count}>
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

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  personText: { flex: 1 },
  spacer: (width: number) => ({ width }),
  search: {
    marginHorizontal: theme.spacing[5],
    marginVertical: theme.spacing[2],
    height: 44,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  input: {
    flex: 1,
    fontSize: theme.type.b2.fontSize,
    color: theme.colors.t1,
    ...inputReset,
    ...fontFor('400'),
  },
  list: { flexGrow: 1 },
  count: {
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[1],
    paddingHorizontal: theme.spacing[5],
  },
}))

export default FollowsScreen

import { Redirect, router } from 'expo-router'
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native'
import { monthDay } from '@push/shared'
import {
  Avatar,
  clock,
  counterpart,
  OFFER_DECLINE,
  OfferPostingCard,
  offerBadge,
  personLine,
  useOffer,
  useOfferDecision,
} from '@/features/my'
import { CtaBar, Badge, Button, Chip, GlassButton, Icon, Skeleton, Text, TopBar } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'

type Box = 'received' | 'sent'

const DECLINE_INSET = Platform.OS === 'ios' ? spacing[1] : 0

const OfferDetailScreen = ({ id, box = 'received' }: { id: string; box?: Box }) => {
  const c = useColors()
  const { data: o, isLoading } = useOffer(id)
  const { decline } = useOfferDecision(id, '', () => undefined)

  if (isLoading || !o) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
        {isLoading ? (
          <View style={{ gap: spacing[4], padding: spacing[5] }}>
            <Skeleton width="60%" height={24} />
            <Skeleton width="100%" height={96} />
          </View>
        ) : null}
      </View>
    )
  }

  if (o.status === 'ACCEPTED') return <Redirect href={`/offers/${o.id}/messages?box=${box}`} />

  const who = counterpart(o, box)
  const badge = offerBadge(o, box)
  const pending = box === 'received' && (o.status === 'SENT' || o.status === 'READ')
  const p = o.posting

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        onBack={() => router.back()}
        right={
          <GlassButton
            actions={[
              {
                icon: 'menu',
                label: '더 보기',
                menu: [{ key: 'profile', label: '허브 프로필 보기', systemImage: 'person', icon: 'user', onPress: () => router.push(`/profiles/${who.id}`) }],
              },
            ]}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ gap: spacing[5], paddingTop: spacing[1], paddingHorizontal: spacing[5], paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
          <Avatar name={who.displayName} url={who.avatarUrl} size={56} />
          <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Text v="h3" accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>
                {who.displayName}
              </Text>
              <Badge label={badge.label} tone={badge.tone} />
            </View>
            {personLine(who) ? (
              <Text v="c1" color="t3">
                {personLine(who)}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ alignSelf: 'flex-start' }}>
          <Chip label="허브 프로필 보기" icon="user" chevron onPress={() => router.push(`/profiles/${who.id}`)} />
        </View>
        <View
          style={{
            borderRadius: radius.card,
            backgroundColor: c.bg2,
            paddingVertical: spacing[4],
            paddingHorizontal: spacing[5],
          }}
        >
          <Text v="b1" style={{ lineHeight: 25 }}>
            {o.message}
          </Text>
        </View>
        <Text v="c1" color="t3" style={{ marginTop: -spacing[2] }}>
          {monthDay(o.createdAt)} {clock(o.createdAt)} · {box === 'received' ? '받음' : '보냄'}
        </Text>

        {p ? <OfferPostingCard posting={p} /> : null}

        {pending && p ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/(stack)/(tabs)/(chat)/chat')}
            style={{
              paddingVertical: spacing[4],
              paddingHorizontal: spacing[5],
              borderRadius: radius.card,
              backgroundColor: c.acSoft,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
            }}
          >
            <Icon name="spark" size={22} color={c.ac} />
            <View style={{ flex: 1 }}>
              <Text v="b2" weight="700">
                답장 전에 이 공고에 맞춰 볼까요?
              </Text>
              <Text v="c1" color="t2">
                에이전트가 적합도를 보고 이력서를 고쳐 드려요
              </Text>
            </View>
            <Icon name="chev" size={18} color={c.ac} />
          </Pressable>
        ) : null}
      </ScrollView>

      {pending ? (
        <CtaBar>
          <Button
            label="거절"
            variant="secondary"
            disabled={decline.isPending}
            style={{ paddingHorizontal: DECLINE_INSET }}
            onPress={() =>
              Alert.alert('이 제안을 거절할까요?', `${who.displayName} 님에게 거절했다고 알려요.`, [
                { text: '취소', style: 'cancel' },
                { text: OFFER_DECLINE, style: 'destructive', onPress: () => decline.mutate() },
              ])
            }
          />
          <Button label="수락하고 답장하기" onPress={() => router.push(`/offers/${o.id}/reply`)} style={{ flex: 1 }} />
        </CtaBar>
      ) : null}
    </View>
  )
}

export default OfferDetailScreen

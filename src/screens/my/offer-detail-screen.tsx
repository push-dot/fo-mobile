import { Redirect, router } from 'expo-router'
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native'
import { monthDay } from '@push/shared'
import {
  Avatar,
  clock,
  counterpart,
  Logo,
  OFFER_DECLINE,
  OfferPostingCard,
  offerBadge,
  personLine,
  useOffer,
  useOfferDecision,
  useOfferMenu,
  useViewerBox,
} from '@/features/my'
import { openPostingBot } from '@/features/bots'
import { CtaBar, Badge, Button, Chip, Icon, Skeleton, Text, NativeTopBar } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'

type Box = 'received' | 'sent'

const OfferDetailScreen = ({ id, box: hint = 'received' }: { id: string; box?: Box }) => {
  const { data: o, isLoading } = useOffer(id)
  const box = useViewerBox(o, hint)
  const { decline } = useOfferDecision(id, '', () => undefined)
  const menu = useOfferMenu(o, box)

  if (isLoading || !o) {
    return (
      <View style={styles.root}>
        <NativeTopBar onBack={() => router.back()} />
        {isLoading ? (
          <View style={styles.loading}>
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
    <View style={styles.root}>
      <NativeTopBar
        onBack={() => router.back()}
        actions={menu ? [{ icon: 'more', label: '더 보기', menu }] : undefined}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          {who.kind === 'COMPANY' ? (
            <Logo name={who.companyName ?? who.displayName} size={56} mono />
          ) : (
            <Avatar name={who.displayName} url={who.avatarUrl} size={56} />
          )}
          <View style={styles.headText}>
            <View style={styles.nameRow}>
              <Text v="h3" accessibilityRole="header" numberOfLines={1} style={styles.name}>
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
        <View style={styles.profileChip}>
          <Chip label="허브 프로필 보기" icon="user" chevron onPress={() => router.push(`/profiles/${who.id}`)} />
        </View>
        <View style={styles.message}>
          <Text v="b1" style={styles.messageText}>
            {o.message}
          </Text>
        </View>
        <Text v="c1" color="t3" style={styles.meta}>
          {monthDay(o.createdAt)} {clock(o.createdAt)} · {box === 'received' ? '받음' : '보냄'}
        </Text>

        {p ? <OfferPostingCard posting={p} /> : null}

        {pending && p ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openPostingBot(p.id)}
            style={styles.bot}
          >
            <Text v="b2" weight="700" style={styles.flex}>
              Bot한테 이 공고 보내기
            </Text>
            <Icon name="chev" size={18} color="t3" />
          </Pressable>
        ) : null}
      </ScrollView>

      {pending ? (
        <CtaBar>
          <Button
            label="거절"
            variant="secondary"
            disabled={decline.isPending}
            style={styles.decline}
            onPress={() =>
              Alert.alert('이 제안을 거절할까요?', `${o.sender.displayName} 님에게 이번 제안은 정중히 거절한다고 전해요.`, [
                { text: '취소', style: 'cancel' },
                { text: OFFER_DECLINE, style: 'destructive', onPress: () => decline.mutate() },
              ])
            }
          />
          <Button label="수락하고 답장하기" onPress={() => router.push(`/offers/${o.id}/reply`)} style={styles.flex} />
        </CtaBar>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { gap: theme.spacing[4], padding: theme.spacing[5] },
  content: { gap: theme.spacing[5], paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[5], paddingBottom: 120 },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4] },
  headText: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  name: { flexShrink: 1 },
  profileChip: { alignSelf: 'flex-start' },
  message: { borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2, paddingVertical: theme.spacing[4], paddingHorizontal: theme.spacing[5] },
  messageText: { lineHeight: 25 },
  meta: { marginTop: -theme.spacing[2] },
  bot: {
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[5],
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.bg2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  flex: { flex: 1 },
  decline: { paddingHorizontal: Platform.OS === 'ios' ? theme.spacing[1] : 0 },
}))

export default OfferDetailScreen

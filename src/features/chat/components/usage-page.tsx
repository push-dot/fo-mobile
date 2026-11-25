import { router } from 'expo-router'
import { Alert, Animated, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '../../../theme'
import { Button, GlassButton, SettingsGroup, Text, useGrow } from '@/shared/components'
import { PAYMENTS_CLOSED_MESSAGE, paymentsOpen, usePersonalPurchase } from '@/features/billing'
import { useChatAccount } from '../api/hooks'
import { USAGE_BY_BOT_TITLE, USAGE_TITLE } from '../constants'
import { usagePercent } from '../utils/account-menus'
import GroupTitle from './group-title'
import Note from './note'
import PageModal from './page-modal'

const back = [{ icon: 'back', label: '뒤로', onPress: () => router.back() }] as const

const monthDay = (iso?: string) => {
  const at = iso ? new Date(iso) : null
  return at && !Number.isNaN(at.getTime()) ? `${at.getMonth() + 1}월 ${at.getDate()}일` : null
}

const TITLE = { paddingTop: 22, paddingBottom: spacing[2], paddingHorizontal: spacing[6] } as const

export const UsagePage = () => {
  const account = useChatAccount(true).data
  const purchase = usePersonalPurchase()
  const open = paymentsOpen(account)
  const percent = usagePercent(account?.credits)
  const refill = monthDay(account?.creditsRefillAt)
  const bots = account?.usageByBot ?? []
  const grow = useGrow(150)
  const fillWidth = { width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${percent}%`] }) }
  const buy = () => {
    if (purchase.pending) return
    if (open) purchase.buyCredits()
    else Alert.alert(PAYMENTS_CLOSED_MESSAGE)
  }
  return (
    <PageModal title={USAGE_TITLE} tight page nav left={<GlassButton actions={[...back]} />}>
      {percent == null ? null : (
        <>
          <View style={styles.card}>
            <View style={styles.head}>
              <Text v="h1" style={styles.percent}>{`${percent}%`}</Text>
              <Text v="c1" color="t3">{`${account?.plan ?? ''} · 이번 달`}</Text>
            </View>
            <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={styles.track}>
              <Animated.View style={[styles.fill, fillWidth]} />
            </View>
          </View>
          {bots.length ? (
            <>
              <GroupTitle style={TITLE}>{USAGE_BY_BOT_TITLE}</GroupTitle>
              <View style={styles.group}>
                <SettingsGroup>
                  {bots.map((b) => (
                    <View key={b.name} style={styles.row}>
                      <Text v="b1" style={styles.name}>{b.name}</Text>
                      <Text v="b2" color="t2" style={styles.nums}>{`${b.percent}%`}</Text>
                    </View>
                  ))}
                </SettingsGroup>
              </View>
            </>
          ) : null}
          {refill ? <Note style={styles.note}>{`${refill}에 다시 채워져요.`}</Note> : null}
          <View style={styles.action}>
            <Button label="크레딧 구매" variant="secondary" onPress={buy} disabled={purchase.pending} />
          </View>
        </>
      )}
    </PageModal>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: { marginTop: theme.spacing[4], marginHorizontal: theme.spacing[5], paddingHorizontal: theme.spacing[4], paddingVertical: 18, gap: 10, borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  percent: { fontSize: 34, lineHeight: 40, fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: theme.colors.fill2, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.ac },
  group: { paddingHorizontal: theme.spacing[5] },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  name: { flex: 1 },
  nums: { fontVariant: ['tabular-nums'] },
  note: { paddingTop: theme.spacing[2] },
  action: { paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4] },
}))

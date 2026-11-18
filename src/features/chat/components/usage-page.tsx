import { router } from 'expo-router'
import { Alert, View } from 'react-native'
import { radius, spacing, useColors } from '../../../theme'
import { Button, GlassButton, SettingsGroup, Text } from '@/shared/components'
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

/** 사용량 (ChatAccountUsage): the month's share in big type, a bar, each bot's share and the refill day. */
export const UsagePage = () => {
  const c = useColors()
  const account = useChatAccount(true).data
  const purchase = usePersonalPurchase()
  const open = paymentsOpen(account)
  const percent = usagePercent(account?.credits)
  const refill = monthDay(account?.creditsRefillAt)
  const bots = account?.usageByBot ?? []
  const buy = () => {
    if (purchase.pending) return
    if (open) purchase.buyCredits()
    else Alert.alert(PAYMENTS_CLOSED_MESSAGE)
  }
  return (
    <PageModal title={USAGE_TITLE} tight page nav left={<GlassButton actions={[...back]} />}>
      {percent == null ? null : (
        <>
          <View style={{ marginTop: spacing[4], marginHorizontal: spacing[5], paddingHorizontal: spacing[4], paddingVertical: 18, gap: 10, borderRadius: radius.card, backgroundColor: c.bg2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text v="h1" style={{ fontSize: 34, lineHeight: 40, fontVariant: ['tabular-nums'] }}>{`${percent}%`}</Text>
              <Text v="c1" color="t3">{`${account?.plan ?? ''} · 이번 달`}</Text>
            </View>
            <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}>
              <View style={{ width: `${percent}%`, height: 6, borderRadius: 3, backgroundColor: c.ac }} />
            </View>
          </View>
          {bots.length ? (
            <>
              <GroupTitle style={TITLE}>{USAGE_BY_BOT_TITLE}</GroupTitle>
              <View style={{ paddingHorizontal: spacing[5] }}>
                <SettingsGroup>
                  {bots.map((b) => (
                    <View key={b.name} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                      <Text v="b1" style={{ flex: 1 }}>{b.name}</Text>
                      <Text v="b2" color="t2" style={{ fontVariant: ['tabular-nums'] }}>{`${b.percent}%`}</Text>
                    </View>
                  ))}
                </SettingsGroup>
              </View>
            </>
          ) : null}
          {refill ? <Note style={{ paddingTop: spacing[2] }}>{`${refill}에 다시 채워져요.`}</Note> : null}
          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            <Button label="크레딧 구매" variant="secondary" onPress={buy} disabled={purchase.pending} />
          </View>
        </>
      )}
    </PageModal>
  )
}

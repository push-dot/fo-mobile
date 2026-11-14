import { router } from 'expo-router'
import { Alert, View } from 'react-native'
import { spacing, useColors } from '../../../theme'
import { Button, GlassButton, SettingsGroup, Text } from '@/shared/components'
import { PAYMENTS_CLOSED_MESSAGE, paymentsOpen, usePersonalPurchase } from '@/features/billing'
import { useChatAccount } from '../api/hooks'
import { botUsageRows, usagePercent } from '../utils/account-menus'
import GroupTitle from './group-title'
import Note from './note'
import PageModal from './page-modal'

// The boards pad a group title 22 above and 8 below, and the page stacks its blocks 4 apart (as ChatAccount).
const TITLE = { paddingTop: 22, paddingBottom: spacing[2], paddingHorizontal: spacing[6] } as const

const refillNote = (iso?: string) => {
  if (!iso) return null
  const at = new Date(iso)
  return `${at.getMonth() + 1}월 ${at.getDate()}일에 다시 채워져요.`
}

/** 계정 › 사용량 (ChatAccountUsage): the month's usage and the credit purchase, one page deeper than the account modal. */
export const UsagePage = () => {
  const c = useColors()
  const account = useChatAccount(true).data
  const purchase = usePersonalPurchase()
  const percent = usagePercent(account?.credits) ?? 0
  const bots = botUsageRows(account)
  const note = refillNote(account?.creditsRefillAt)
  const buy = () => {
    if (purchase.pending) return
    if (paymentsOpen(account)) purchase.buyCredits()
    else Alert.alert(PAYMENTS_CLOSED_MESSAGE)
  }
  return (
    <PageModal title="사용량" tight left={<GlassButton actions={[{ icon: 'back', label: '뒤로', onPress: () => router.back() }]} />}>
      {account ? (
        <>
          <View style={{ marginHorizontal: spacing[5], marginTop: spacing[2] }}>
            <SettingsGroup>
              <View style={{ paddingVertical: 18, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Text v="h1" style={{ fontSize: 34, lineHeight: 40 }}>
                    {percent}%
                  </Text>
                  <Text v="c1" color="t3">
                    {account.plan} · 이번 달
                  </Text>
                </View>
                <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}>
                  <View style={{ width: `${percent}%`, height: 6, backgroundColor: c.ac }} />
                </View>
              </View>
            </SettingsGroup>
          </View>
          {bots.length ? (
            <>
              <GroupTitle style={TITLE}>Bot별</GroupTitle>
              <View style={{ marginHorizontal: spacing[5] }}>
                <SettingsGroup>
                  {bots.map((b) => (
                    <View key={b.id} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                      <Text v="b1" numberOfLines={1} style={{ flex: 1 }}>
                        {b.name}
                      </Text>
                      <Text v="b2" color="t2">
                        {b.percent}%
                      </Text>
                    </View>
                  ))}
                </SettingsGroup>
              </View>
            </>
          ) : null}
          {note ? <Note style={{ paddingTop: spacing[2] }}>{note}</Note> : null}
          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            <Button label="크레딧 구매" variant="secondary" onPress={buy} disabled={purchase.pending} />
          </View>
        </>
      ) : null}
    </PageModal>
  )
}

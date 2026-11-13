import { router } from 'expo-router'
import { Alert, View } from 'react-native'
import { radius, spacing, useColors } from '../../../theme'
import { Button, GlassButton, Text } from '@/shared/components'
import { PAYMENTS_CLOSED_MESSAGE, paymentsOpen, usePersonalPurchase } from '@/features/billing'
import { useChatAccount } from '../api/hooks'
import { usagePercent } from '../utils/account-menus'
import PageModal from './page-modal'

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
          <View style={{ marginHorizontal: spacing[5], marginTop: spacing[2], padding: spacing[4], gap: spacing[3], borderRadius: radius.card, backgroundColor: c.bg2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text v="h1">{percent}%</Text>
              <Text v="c1" color="t3">
                {account.plan} · 이번 달
              </Text>
            </View>
            <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}>
              <View style={{ width: `${percent}%`, height: 6, backgroundColor: c.ac }} />
            </View>
          </View>
          {note ? (
            <Text v="c2" color="t3" style={{ paddingHorizontal: spacing[6], paddingTop: spacing[3] }}>
              {note}
            </Text>
          ) : null}
          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            <Button label="크레딧 구매" variant="secondary" onPress={buy} disabled={purchase.pending} />
          </View>
        </>
      ) : null}
    </PageModal>
  )
}

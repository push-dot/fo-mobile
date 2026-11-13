import { router } from 'expo-router'
import { Alert, Pressable, View } from 'react-native'
import { radius, selectedRing, spacing, useColors } from '../../../theme'
import { Badge, Button, GlassButton, Icon, Text } from '@/shared/components'
import { PAYMENTS_CLOSED_MESSAGE, paymentsOpen, usePersonalPurchase } from '@/features/billing'
import { useChatAccount } from '../api/hooks'
import { PLAN_FOOT, PLAN_HEADER, PLAN_NOTICES, PLAN_NOTICE_FOOT } from '../constants'
import { Appear } from './motion'
import PageModal from './page-modal'

const PLANS = [
  { key: 'ULTRA', price: '$100 / 월', features: ['PRO의 4배 사용량', '역량 보완 프로젝트 무제한'] },
  { key: 'PRO', price: '$30 / 월', features: ['FREE의 15배 사용량'] },
  { key: 'FREE', price: '무료', features: ['기본 사용량'] },
] as const

const back = [{ icon: 'back', label: '뒤로', onPress: () => router.back() }] as const

const PlanCard = ({ plan, current, disabled, onPress }: { plan: (typeof PLANS)[number]; current: boolean; disabled: boolean; onPress: () => void }) => {
  const c = useColors()
  const ring = selectedRing(c)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: current, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[{ borderRadius: radius.card, padding: spacing[4] - ring.borderWidth, gap: spacing[2], backgroundColor: c.bg2, borderWidth: ring.borderWidth, borderColor: 'transparent' }, current && ring]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Text v="h3">{plan.key}</Text>
        {current ? <Badge label="지금 쓰는 중" /> : plan.key === 'ULTRA' ? <Badge label="추천" /> : null}
        <Text v="b2" weight="700" style={{ flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
          {plan.price}
        </Text>
      </View>
      <View style={{ gap: spacing[1] }}>
        {plan.features.map((f) => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Icon name="check" size={14} color="acText" />
            <Text v="c1" color="t2">
              {f}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  )
}

const LinkRow = ({ label, onPress }: { label: string; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ minHeight: 56, marginTop: spacing[2], marginHorizontal: spacing[5], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
    >
      <Text v="b2" weight="700" style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="chev" size={18} color="t3" />
    </Pressable>
  )
}

/** 플랜 (PlanUpgrade, PlanUltra): its own page with a back button and the pay button at the bottom. */
export const PlanPage = () => {
  const account = useChatAccount(true).data
  const purchase = usePersonalPurchase()
  const open = paymentsOpen(account)
  // The store flow stays as is. Only when the server really has payments off, a tap tells why instead of opening the store.
  const pay = (buy: () => void) => () => {
    if (purchase.pending) return
    if (open) buy()
    else Alert.alert(PAYMENTS_CLOSED_MESSAGE)
  }
  return (
    <PageModal
      title="플랜"
      tight
      left={<GlassButton actions={[...back]} />}
      footer={
        account?.plan === 'ULTRA' ? (
          <Button label="지금 ULTRA를 쓰고 있어요" disabled />
        ) : (
          <Button label="ULTRA로 업그레이드" onPress={pay(() => purchase.buyPlan('ULTRA'))} disabled={purchase.pending || !account} />
        )
      }
    >
      {account ? (
        <Appear kind="fade">
          <Text v="h2" style={{ paddingTop: spacing[1], paddingHorizontal: spacing[6], paddingBottom: spacing[4] }}>
            {PLAN_HEADER}
          </Text>
          <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
            {PLANS.map((p) => (
              <PlanCard
                key={p.key}
                plan={p}
                current={p.key === account.plan}
                disabled={purchase.pending || p.key === 'FREE' || p.key === account.plan}
                onPress={pay(() => purchase.buyPlan(p.key as 'PRO' | 'ULTRA'))}
              />
            ))}
          </View>
          <LinkRow label="크레딧 구매" onPress={pay(() => purchase.buyCredits())} />
          <LinkRow label="구독 안내" onPress={() => router.push('/plan-notice')} />
          <Text v="c1" color="t3" style={{ paddingTop: spacing[3], paddingHorizontal: spacing[6] }}>
            {PLAN_FOOT}
          </Text>
        </Appear>
      ) : null}
    </PageModal>
  )
}

/** 구독 안내 (PlanNotice): the long notice, one page. */
export const PlanNoticePage = () => (
  <PageModal title="구독 안내" tight left={<GlassButton actions={[...back]} />}>
    <View style={{ paddingTop: spacing[2], paddingHorizontal: spacing[6], gap: spacing[3] }}>
      {PLAN_NOTICES.map((line) => (
        <View key={line} style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Text v="b2" color="t3">
            ·
          </Text>
          <Text v="b2" color="t2" style={{ flex: 1 }}>
            {line}
          </Text>
        </View>
      ))}
      <Text v="c1" color="t3" style={{ paddingTop: spacing[2] }}>
        {PLAN_NOTICE_FOOT}
      </Text>
    </View>
  </PageModal>
)

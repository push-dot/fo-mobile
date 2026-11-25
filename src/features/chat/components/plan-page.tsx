import { router } from 'expo-router'
import { Alert, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { selectedRing } from '../../../theme'
import { Badge, Button, GlassButton, Icon, Text } from '@/shared/components'
import { PAYMENTS_CLOSED_MESSAGE, paymentsOpen, usePersonalPurchase } from '@/features/billing'
import { useChatAccount } from '../api/hooks'
import { PLAN_HEADER } from '../constants'
import Appear from './motion'
import PageModal from './page-modal'

const PLANS = [
  { key: 'ULTRA', price: '$100 / 월', features: ['PRO의 4배 사용량', '역량 보완 프로젝트 무제한'] },
  { key: 'PRO', price: '$30 / 월', features: ['FREE의 15배 사용량'] },
  { key: 'FREE', price: '무료', features: ['기본 사용량'] },
] as const

const back = [{ icon: 'back', label: '뒤로', onPress: () => router.back() }] as const

const PlanCard = ({ plan, current, disabled, onPress }: { plan: (typeof PLANS)[number]; current: boolean; disabled: boolean; onPress: () => void }) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: current, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, current && styles.cardOn]}
    >
      <View style={styles.row}>
        <Text v="h3">{plan.key}</Text>
        {current ? <Badge label="지금 쓰는 중" /> : plan.key === 'ULTRA' ? <Badge label="추천" /> : null}
        <Text v="b2" weight="700" style={styles.price}>
          {plan.price}
        </Text>
      </View>
      <View style={styles.features}>
        {plan.features.map((f) => (
          <View key={f} style={styles.row}>
            <Icon name="check" size={14} color="t1" />
            <Text v="c1" color="t2">
              {f}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  )
}

const LinkRow = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
    <Text v="b2" weight="700" style={styles.flex}>
      {label}
    </Text>
    <Icon name="chev" size={18} color="t3" />
  </Pressable>
)

const PlanPage = () => {
  const account = useChatAccount(true).data
  const purchase = usePersonalPurchase()
  const open = paymentsOpen(account)
  const pay = (buy: () => void) => () => {
    if (purchase.pending) return
    if (open) buy()
    else Alert.alert(PAYMENTS_CLOSED_MESSAGE)
  }
  return (
    <PageModal
      title="플랜"
      tight
      page
      nav
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
          <Text v="h2" style={styles.header}>
            {PLAN_HEADER}
          </Text>
          <View style={styles.plans}>
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
        </Appear>
      ) : null}
    </PageModal>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: { borderRadius: theme.radius.card, padding: theme.spacing[4] - selectedRing(theme.colors).borderWidth, gap: theme.spacing[2], backgroundColor: theme.colors.bg2, borderWidth: selectedRing(theme.colors).borderWidth, borderColor: 'transparent' },
  cardOn: selectedRing(theme.colors),
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  price: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  features: { gap: theme.spacing[1] },
  link: { minHeight: 56, marginTop: theme.spacing[3], marginHorizontal: theme.spacing[5], paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  flex: { flex: 1 },
  header: { paddingTop: 10, paddingHorizontal: theme.spacing[6], paddingBottom: theme.spacing[4] },
  plans: { paddingHorizontal: theme.spacing[5], gap: theme.spacing[2] },
}))

export default PlanPage

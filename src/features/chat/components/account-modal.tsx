import { brandColor } from '@push/shared'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { radius, selectedRing, spacing, useColors } from '../../../theme'
import { Badge, Button, GlassButton, Icon, Menu, SettingsGroup, Text } from '@/shared/components'
import { PAYMENTS_CLOSED_MESSAGE, paymentsOpen, usePersonalPurchase } from '@/features/billing'
import { type Account } from '../api/schemas'
import { TONES, useMySettings, useUpdateSettings } from '@/features/my'
import { useAccessMode, useChatAccount, useChatDocs, useMe } from '../api/hooks'
import { useLeaveSidebar } from '../hooks'
import { ACCESS_MODES, ACCOUNT_REFERENCE_NOTE, ACCOUNT_REFERENCE_TITLE, PLAN_FOOTER, PLAN_HEADER } from '../constants'
import { accessMenu, currentRole, toneLabel, toneMenu, usagePercent } from '../utils/account-menus'
import { Appear } from './motion'
import GroupTitle from './group-title'
import Mark from './mark'
import Note from './note'
import PageModal from './page-modal'


/** 계정 modal (ChatAccount) with the 요금제 page inside it (PlanUpgrade). */
export const AccountModal = ({ initialPage = 'account' }: { initialPage?: 'account' | 'plan' }) => {
  const [page, setPage] = useState<'account' | 'plan'>(initialPage)
  const account = useChatAccount(true)
  const purchase = usePersonalPurchase()
  const plan = page === 'plan' && account.data
  // One modal for both pages: 요금제 navigates inside the sheet instead of stacking another.
  return (
    <PageModal
      title={plan ? '요금제' : '계정'}
      tight
      left={plan ? <GlassButton actions={[{ icon: 'back', label: '뒤로', onPress: () => setPage('account') }]} /> : undefined}
      footer={
        !plan ? undefined : account.data!.plan === 'ULTRA' ? (
          <Button label="지금 ULTRA를 쓰고 있어요" disabled />
        ) : !paymentsOpen(account.data) ? (
          <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
            {PAYMENTS_CLOSED_MESSAGE}
          </Text>
        ) : (
          <Button label="ULTRA로 업그레이드" onPress={() => purchase.buyPlan('ULTRA')} disabled={purchase.pending} />
        )
      }
    >
      {plan ? <PlanPage account={account.data!} purchase={purchase} /> : <AccountPage account={account.data} onPlan={() => setPage('plan')} />}
    </PageModal>
  )
}

const AccountRow = ({ label, value, bold, onPress }: { label: string; value?: string; bold?: boolean; onPress?: () => void }) => {
  const body = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <Text v="b1" weight={bold ? '700' : undefined} style={{ flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text v="b2" color="t2">
          {value}
        </Text>
      ) : null}
      <Icon name="chev" size={16} color="t3" />
    </View>
  )
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  )
}

// The board's row is min-height 56 content-box plus 16 padding top and bottom, so the bar sits high with room below.
const USAGE_ROW_HEIGHT = 88

const UsageRow = ({ percent }: { percent: number }) => {
  const c = useColors()
  return (
    <View style={{ minHeight: USAGE_ROW_HEIGHT, paddingVertical: spacing[4], gap: spacing[2] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text v="b1">사용량</Text>
        <Text v="b2" color="t2">
          이번 달 {percent}% 썼어요
        </Text>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}>
        <View style={{ width: `${percent}%`, height: 6, backgroundColor: c.ac }} />
      </View>
    </View>
  )
}

// The boards pad a group title 22 above and 8 below, and the page stacks its blocks 4 apart.
const TITLE = { paddingTop: 22, paddingBottom: spacing[2], paddingHorizontal: spacing[6] } as const
const GROUP = { paddingHorizontal: spacing[5], marginTop: 14 } as const

const AccountPage = ({ account, onPlan }: { account?: Account; onPlan: () => void }) => {
  const me = useMe()
  const settings = useMySettings(true)
  const docs = useChatDocs()
  const save = useUpdateSettings()
  const access = useAccessMode()
  const mode = ACCESS_MODES.find((m) => m.key === access.mode)!
  const leave = useLeaveSidebar()
  const toMy = () => leave(() => router.navigate('/my'))
  const tone = TONES.find((t) => t.key === settings.data?.defaultTone)
  const usage = usagePercent(account?.credits)

  return (
    <>
      <View style={{ alignItems: 'center', gap: spacing[2], paddingTop: spacing[2], paddingHorizontal: spacing[5], paddingBottom: spacing[1] }}>
        <Mark text={me.given} color={brandColor(me.name)} size={76} round />
        <Text v="h2" style={{ marginTop: 6 }}>
          {me.name}
        </Text>
      </View>
      <View style={GROUP}>
        <SettingsGroup>
          <AccountRow label={account?.plan ?? ' '} bold onPress={onPlan} />
          {usage == null ? null : <UsageRow percent={usage} />}
        </SettingsGroup>
      </View>
      <GroupTitle style={TITLE}>{ACCOUNT_REFERENCE_TITLE}</GroupTitle>
      <View style={{ paddingHorizontal: spacing[5] }}>
        <SettingsGroup>
          <AccountRow label={currentRole(me.profile) || '희망 직무'} onPress={toMy} />
          <AccountRow label={me.profile?.tenureYears != null ? `${me.profile.tenureYears}년차` : '연차'} onPress={toMy} />
          <AccountRow label={docs.data?.find((d) => !d.aiMade)?.fileName ?? '기본 서류'} onPress={toMy} />
        </SettingsGroup>
      </View>
      <Note style={{ paddingTop: spacing[2] }}>{ACCOUNT_REFERENCE_NOTE}</Note>
      <GroupTitle style={TITLE}>대화</GroupTitle>
      <View style={{ paddingHorizontal: spacing[5] }}>
        <SettingsGroup>
          <Menu stretch accessibilityLabel="말투" actions={toneMenu(tone?.key, (defaultTone) => save.mutate({ defaultTone }))}>
            <View>
              <AccountRow label={toneLabel(tone)} />
            </View>
          </Menu>
          <Menu stretch accessibilityLabel="실행 방식" actions={accessMenu(mode.key, access.pick)}>
            <View>
              <AccountRow label="실행 방식" value={mode.label} />
            </View>
          </Menu>
        </SettingsGroup>
      </View>
    </>
  )
}

const PLANS = [
  { key: 'ULTRA', price: '$100 / 월', features: ['PRO의 4배 사용량', '역량 보완 프로젝트 무제한'] },
  { key: 'PRO', price: '$30 / 월', features: ['FREE의 15배 사용량'] },
  { key: 'FREE', price: '무료', features: ['기본 사용량'] },
] as const

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
        <Text v="h3">
          {plan.key}
        </Text>
        {current ? <Badge label="지금 쓰는 중" tone="ac" /> : plan.key === 'ULTRA' ? <Badge label="추천" /> : null}
        <Text v="b2" weight="700" style={{ flex: 1, textAlign: 'right' }}>
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

const LINK = { minHeight: 44, justifyContent: 'center' } as const

const PlanPage = ({ account, purchase }: { account: Account; purchase: ReturnType<typeof usePersonalPurchase> }) => {
  const c = useColors()
  const paid = account.plan === 'FREE' ? null : account.plan
  const open = paymentsOpen(account)
  return (
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
            disabled={!open || purchase.pending || p.key === 'FREE' || p.key === account.plan}
            onPress={() => purchase.buyPlan(p.key as 'PRO' | 'ULTRA')}
          />
        ))}
      </View>
      {open ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => !purchase.pending && purchase.buyCredits()}
          style={{ minHeight: 56, marginTop: spacing[3], marginHorizontal: spacing[5], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
        >
          <Text v="b2" weight="700" style={{ flex: 1 }}>
            크레딧 구매
          </Text>
          <Icon name="chev" size={18} color="t3" />
        </Pressable>
      ) : null}
      <View style={{ paddingTop: spacing[3], paddingHorizontal: spacing[6], gap: spacing[1] }}>
        {PLAN_FOOTER.map((line) => (
          <Text key={line} v="c1" color="t3">
            {line}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[5], paddingHorizontal: spacing[6] }}>
        {paid ? <PlanLink label="요금제 낮추기" onPress={() => purchase.manage(paid)} /> : null}
        {open ? <PlanLink label="구매 복원" onPress={() => !purchase.pending && purchase.restore()} /> : null}
      </View>
    </Appear>
  )
}

const PlanLink = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="link" onPress={onPress} style={LINK}>
    <Text v="c1" weight="600" color="t2" style={{ textDecorationLine: 'underline' }}>
      {label}
    </Text>
  </Pressable>
)

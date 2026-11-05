import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { fontFor, useColors } from '../../../theme'
import { Badge, BottomSheet, Button, GlassButton, Icon, Menu, SettingsGroup, SettingsRow, Text } from '@/shared/components'
import { usePersonalPurchase } from '@/features/billing'
import { type Account } from '../api/schemas'
import { TONES, useMySettings, useUpdateSettings } from '@/features/my'
import { useAccessMode, useChatAccount, useChatDocs, useMe } from '../api/hooks'
import { ACCESS_MODES, ACCOUNT_REFERENCE_NOTE, ACCOUNT_REFERENCE_TITLE, PLAN_FOOTER, PLAN_HEADER } from '../constants'
import { accessMenu, toneMenu } from '../utils/account-menus'
import { Appear } from './motion'
import Mark from './mark'
import PageModal from './page-modal'
import Pick from './pick'

const EFFORTS = [
  { key: 'LOW', label: '가볍게' },
  { key: 'MEDIUM', label: '보통 강도로' },
  { key: 'HIGH', label: '꼼꼼하게' },
  { key: 'MAX', label: '최대 강도로' },
] as const
const RETENTION = [7, 30, 90, 365]

type Picker = { title: string; options: string[]; value: number; onPick: (i: number) => void } | null

/** 계정 modal (ChatAccount) with the 요금제 page inside it (PlanUpgrade). */
export const AccountModal = ({
  visible,
  onClose,
  initialPage = 'account',
}: {
  visible: boolean
  onClose: () => void
  initialPage?: 'account' | 'plan'
}) => {
  const [page, setPage] = useState<'account' | 'plan'>(initialPage)
  const [seen, setSeen] = useState(visible)
  if (visible !== seen) {
    setSeen(visible)
    if (visible) setPage(initialPage)
  }
  const close = () => (setPage('account'), onClose())
  const account = useChatAccount(visible)
  const purchase = usePersonalPurchase()
  const plan = page === 'plan' && account.data
  // One modal for both pages: 요금제 navigates inside the sheet instead of stacking another.
  return (
    <PageModal
      visible={visible}
      onClose={close}
      title={plan ? '요금제' : '계정'}
      left={plan ? <GlassButton actions={[{ icon: 'back', label: '뒤로', onPress: () => setPage('account') }]} /> : undefined}
      footer={
        !plan ? undefined : account.data!.plan === 'ULTRA' ? (
          <Button label="지금 ULTRA를 쓰고 있어요" disabled />
        ) : (
          <Button label="ULTRA로 업그레이드" onPress={() => purchase.buyPlan('ULTRA')} disabled={purchase.pending} />
        )
      }
    >
      {plan ? <PlanPage account={account.data!} purchase={purchase} /> : <AccountPage visible={visible} account={account.data} onPlan={() => setPage('plan')} onClose={close} />}
    </PageModal>
  )
}

const AccountPage = ({ visible, account, onPlan, onClose }: { visible: boolean; account?: Account; onPlan: () => void; onClose: () => void }) => {
  const me = useMe()
  const [picker, setPicker] = useState<Picker>(null)
  const settings = useMySettings(visible)
  const docs = useChatDocs(visible)
  const save = useUpdateSettings()
  const access = useAccessMode()
  const mode = ACCESS_MODES.find((m) => m.key === access.mode)!
  const toMy = () => (onClose(), router.navigate('/my'))
  const tone = TONES.find((t) => t.key === settings.data?.defaultTone)
  const days = settings.data?.chatRetentionDays
  const effort = EFFORTS.find((e) => e.key === settings.data?.defaultEffort)

  return (
    <>
      <View style={{ alignItems: 'center', gap: 6, paddingTop: 6, paddingHorizontal: 20, paddingBottom: 4 }}>
        <Mark text={me.given} color="#3B5BDB" size={76} round />
        <Text v="h2" style={{ marginTop: 6 }}>
          {me.name}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 22 }}>
        <SettingsGroup>
          <SettingsRow label={account?.plan ?? ' '} onPress={onPlan} />
        </SettingsGroup>
        <View>
          <SettingsGroup title={ACCOUNT_REFERENCE_TITLE} note={ACCOUNT_REFERENCE_NOTE}>
            <SettingsRow label={me.profile?.headline || '희망 직무'} onPress={toMy} />
            <SettingsRow label={me.profile?.tenureYears != null ? `${me.profile.tenureYears}년차` : '연차'} onPress={toMy} />
            <SettingsRow label={docs.data?.find((d) => !d.aiMade)?.fileName ?? '기본 서류'} onPress={toMy} />
          </SettingsGroup>
        </View>
        <SettingsGroup title="대화">
          <Menu stretch accessibilityLabel="말투" actions={toneMenu(tone?.key, (defaultTone) => save.mutate({ defaultTone }))}>
            <View>
              <SettingsRow label={tone ? `${tone.label} 말투` : '그대로'} right={<Icon name="chev" size={18} color="t4" />} />
            </View>
          </Menu>
          <SettingsRow
            label={effort ? `${effort.label} 작업` : '작업 강도'}
            onPress={() =>
              setPicker({ title: '얼마나 꼼꼼히 할까요?', options: EFFORTS.map((e) => e.label), value: EFFORTS.indexOf(effort ?? EFFORTS[1]), onPick: (i) => save.mutate({ defaultEffort: EFFORTS[i]!.key }) })
            }
          />
          <Menu stretch accessibilityLabel="실행 방식" actions={accessMenu(mode.key, access.pick)}>
            <View>
              <SettingsRow label={mode.label} sub={mode.desc} right={<Icon name="chev" size={18} color="t4" />} />
            </View>
          </Menu>
          <SettingsRow
            label={days ? `대화 기록 ${days}일 보관` : '대화 기록 보관'}
            onPress={() =>
              setPicker({ title: '대화 기록을 얼마나 보관할까요?', options: RETENTION.map((d) => `${d}일`), value: Math.max(0, RETENTION.indexOf(days ?? 30)), onPick: (i) => save.mutate({ chatRetentionDays: RETENTION[i]! }) })
            }
          />
        </SettingsGroup>
      </View>
      <BottomSheet visible={!!picker} onClose={() => setPicker(null)} title={picker?.title}>
        {picker?.options.map((o, i) => (
          <Pressable
            key={o}
            accessibilityRole="radio"
            accessibilityState={{ selected: i === picker.value }}
            onPress={() => (picker.onPick(i), setPicker(null))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}
          >
            <Text v="b1" style={{ flex: 1 }}>
              {o}
            </Text>
            <Pick on={i === picker.value} />
          </Pressable>
        ))}
      </BottomSheet>
    </>
  )
}

const PLANS = [
  { key: 'ULTRA', price: '$100', usage: 'PRO의 4배 사용량', features: ['PRO의 4배 사용량', '역량 보완 프로젝트 무제한'] },
  { key: 'PRO', price: '$30', usage: 'FREE의 15배 사용량', features: [] },
  { key: 'FREE', price: '무료', usage: '기본 사용량', features: [] },
] as const

const PlanPage = ({ account, purchase }: { account: Account; purchase: ReturnType<typeof usePersonalPurchase> }) => {
  const c = useColors()
  const [ultra, ...rest] = PLANS
  const current = account.plan
  const buy = (plan: 'PRO' | 'ULTRA') => {
    if (!purchase.pending && plan !== current) purchase.buyPlan(plan)
  }
  return (
    <Appear kind="fade">
      <Text v="h1" style={{ fontSize: 25, lineHeight: 34, paddingTop: 6, paddingHorizontal: 24, paddingBottom: 16 }}>
        {PLAN_HEADER}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={purchase.pending || current === 'ULTRA'}
        onPress={() => buy('ULTRA')}
        style={{ marginHorizontal: 20, borderRadius: 22, padding: 20, gap: 10, backgroundColor: c.acSoft, borderWidth: 2, borderColor: c.ac }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 22, lineHeight: 28, ...fontFor('800'), color: c.t1 }}>ULTRA</Text>
          {current === 'ULTRA' ? <Badge label="지금 쓰는 중" /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 24, lineHeight: 30, ...fontFor('700'), color: c.t1 }}>{ultra.price}</Text>
          <Text v="b2" color="t3">
            / 월
          </Text>
        </View>
        <View style={{ gap: 7, marginTop: 2 }}>
          {ultra.features.map((f) => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={16} color="acText" />
              <Text v="b2">{f}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 12, paddingHorizontal: 20 }}>
        {rest.map((p) => (
          <Pressable
            key={p.key}
            accessibilityRole="button"
            disabled={purchase.pending || p.key === 'FREE' || p.key === current}
            onPress={() => (p.key === 'PRO' ? buy('PRO') : undefined)}
            style={{ flex: 1, padding: 16, borderRadius: 20, gap: 4, backgroundColor: c.bg2, borderWidth: 1.5, borderColor: p.key === current ? c.line : 'transparent' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text v="h3">{p.key}</Text>
              {p.key === current ? <Badge label="지금 쓰는 중" /> : null}
            </View>
            <Text v="b1" weight="700">
              {p.key === 'FREE' ? p.price : `${p.price} / 월`}
            </Text>
            <Text v="c1" color="t3">
              {p.usage}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ paddingTop: 14, paddingHorizontal: 24, gap: 4 }}>
        {PLAN_FOOTER.map((line) => (
          <Text key={line} v="c1" color="t3">
            {line}
          </Text>
        ))}
      </View>
      <View style={{ marginTop: 22, marginHorizontal: 20 }}>
        <SettingsGroup>
          <SettingsRow label="크레딧 구매" right={<Button label="구매" size="sm" variant="secondary" onPress={purchase.buyCredits} disabled={purchase.pending} />} />
          <SettingsRow label="구매 복원" onPress={purchase.pending ? undefined : purchase.restore} />
        </SettingsGroup>
      </View>
    </Appear>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Settings, Tone } from '@push/api-client'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { api } from '../../lib/api'
import { fontFor, useColors } from '../../theme'
import { Badge, BottomSheet, Button, GlassButton, Icon, SegmentedControl, SettingsGroup, SettingsRow, Switch, Text } from '../../ui'
import { chatApi, type Account } from './api'
import { useMe } from './useMe'
import { Appear } from './motion'
import { Mark, Note, PageModal, Pick } from './parts'
import { usePrefs } from './store'

const TONES: { key: Tone; label: string }[] = [
  { key: 'as_is', label: '그대로' },
  { key: 'professional', label: '전문적인' },
  { key: 'confident', label: '자신감 있는' },
  { key: 'concise', label: '간결한' },
  { key: 'technical', label: '기술 중심' },
  { key: 'friendly', label: '친근한' },
]
const EFFORTS = [
  { key: 'LOW', label: '가볍게' },
  { key: 'MEDIUM', label: '보통 강도로' },
  { key: 'HIGH', label: '꼼꼼하게' },
  { key: 'MAX', label: '최대 강도로' },
] as const
const RETENTION = [7, 30, 90, 365]

type Picker = { title: string; options: string[]; value: number; onPick: (i: number) => void } | null

/** 계정 modal (ChatAccount) with the 요금제 page inside it (PlanUpgrade). */
export function AccountModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [page, setPage] = useState<'account' | 'plan'>('account')
  const close = () => (setPage('account'), onClose())
  const account = useQuery({ queryKey: ['chat', 'account'], queryFn: chatApi.account, enabled: visible })
  const checkout = useMutation({
    mutationFn: () => chatApi.checkout('ULTRA'),
    onSuccess: ({ url }) => void WebBrowser.openBrowserAsync(url),
    onError: () => Alert.alert('결제 화면을 열지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
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
          <Button label="ULTRA로 업그레이드" onPress={() => checkout.mutate()} disabled={checkout.isPending} />
        )
      }
    >
      {plan ? <PlanPage account={account.data!} /> : <AccountPage visible={visible} account={account.data} onPlan={() => setPage('plan')} onClose={close} />}
    </PageModal>
  )
}

function AccountPage({ visible, account, onPlan, onClose }: { visible: boolean; account?: Account; onPlan: () => void; onClose: () => void }) {
  const c = useColors()
  const qc = useQueryClient()
  const me = useMe()
  const prefs = usePrefs()
  const [picker, setPicker] = useState<Picker>(null)
  const settings = useQuery({ queryKey: ['me', 'settings'], queryFn: api.me.settings, enabled: visible })
  const docs = useQuery({ queryKey: ['chat', 'docs'], queryFn: chatApi.docs, enabled: visible })
  const save = useMutation({
    mutationFn: (patch: Partial<Settings>) => api.me.updateSettings(patch),
    onSuccess: (s) => qc.setQueryData(['me', 'settings'], s),
    onError: () => Alert.alert('바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
  const toMy = () => (onClose(), router.navigate('/my'))
  const tone = TONES.find((t) => t.key === settings.data?.defaultTone)
  const days = settings.data?.chatRetentionDays
  const effort = EFFORTS.find((e) => e.key === prefs.effort)!
  const credits = account?.credits

  return (
    <>
      <View style={{ alignItems: 'center', gap: 6, paddingTop: 6, paddingHorizontal: 20, paddingBottom: 4 }}>
        <Mark text={me.given} color="#3B5BDB" size={76} round />
        <Text v="h2" style={{ marginTop: 6 }}>
          {me.name}
        </Text>
        {account?.email ? (
          <Text v="b2" color="t3">
            {account.email}
          </Text>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 22 }}>
        <SettingsGroup>
          <SettingsRow label={account?.plan ?? ' '} onPress={onPlan} />
          {credits ? (
            <View style={{ paddingVertical: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text v="b1">사용량</Text>
                <Text v="b1" color="t2" style={{ fontVariant: ['tabular-nums'] }}>
                  {credits.used.toLocaleString()} / {credits.total.toLocaleString()} 크레딧
                </Text>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: credits.total, now: credits.used }}
                style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}
              >
                <View style={{ width: `${Math.min(100, (credits.used / credits.total) * 100)}%`, height: '100%', backgroundColor: c.ac }} />
              </View>
            </View>
          ) : null}
        </SettingsGroup>
        <View>
          <SettingsGroup title="AI가 참고하는 내 정보" note="대화를 시작할 때 AI가 이 정보부터 읽어요.">
            <SettingsRow label={me.profile?.headline || '희망 직무'} onPress={toMy} />
            <SettingsRow label={me.profile?.tenureYears != null ? `${me.profile.tenureYears}년차` : '연차'} onPress={toMy} />
            <SettingsRow label={docs.data?.find((d) => !d.aiMade)?.fileName ?? '기본 서류'} onPress={toMy} />
          </SettingsGroup>
        </View>
        <SettingsGroup title="대화">
          <SettingsRow
            label={tone ? `${tone.label} 말투` : '답변 말투'}
            onPress={() =>
              setPicker({ title: '어떤 말투로 답할까요?', options: TONES.map((t) => t.label), value: TONES.indexOf(tone ?? TONES[0]!), onPick: (i) => save.mutate({ defaultTone: TONES[i]!.key }) })
            }
          />
          <SettingsRow
            label={`${effort.label} 작업`}
            onPress={() =>
              setPicker({ title: '얼마나 꼼꼼히 할까요?', options: EFFORTS.map((e) => e.label), value: EFFORTS.indexOf(effort), onPick: (i) => usePrefs.setState({ effort: EFFORTS[i]!.key }) })
            }
          />
          <SettingsRow label="바꾸기 전에 확인" right={<Switch label="바꾸기 전에 확인" value={prefs.confirm} onValueChange={(v) => usePrefs.setState({ confirm: v })} />} />
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
  { key: 'ULTRA', monthly: 29000, credits: 20000, features: ['월 20,000 크레딧 · 지금의 4배', '역량 보완 프로젝트 무제한', '대화 기록 무제한 보관'] },
  { key: 'PRO', monthly: 7900, credits: 5000, features: [] },
  { key: 'FREE', monthly: 0, credits: 300, features: [] },
] as const

const won = (n: number) => (n ? `${n.toLocaleString()}원` : '무료')

function PlanPage({ account }: { account: Account }) {
  const c = useColors()
  const [period, setPeriod] = useState<'month' | 'year'>('year')
  const price = (m: number) => (period === 'year' ? Math.round((m * 0.8) / 100) * 100 : m)
  const [ultra, ...rest] = PLANS
  const current = account.plan
  return (
    <Appear kind="fade">
      <Text v="h1" style={{ fontSize: 25, lineHeight: 34, paddingTop: 6, paddingHorizontal: 24, paddingBottom: 16 }}>
        {'더 많이 맡기고\n더 빨리 붙어요'}
      </Text>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <SegmentedControl
          items={[
            { key: 'month', label: '월간' },
            { key: 'year', label: '연간 -20%' },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </View>
      <View style={{ marginHorizontal: 20, borderRadius: 22, padding: 20, gap: 10, backgroundColor: c.acSoft, borderWidth: 2, borderColor: c.ac }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 22, lineHeight: 28, ...fontFor('800'), color: c.t1 }}>ULTRA</Text>
          <View style={{ height: 22, paddingHorizontal: 7, borderRadius: 6, backgroundColor: c.ac, justifyContent: 'center' }}>
            <Text v="c2" weight="700" style={{ color: '#FFFFFF' }}>
              추천
            </Text>
          </View>
          {current === 'ULTRA' ? <Badge label="지금 쓰는 중" /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 24, lineHeight: 30, ...fontFor('700'), color: c.t1 }}>{won(price(ultra.monthly))}</Text>
          <Text v="b2" color="t3">
            / 월
          </Text>
          {period === 'year' ? (
            <Text v="c1" color="t4" style={{ marginLeft: 6, textDecorationLine: 'line-through' }}>
              {won(ultra.monthly)}
            </Text>
          ) : null}
        </View>
        <View style={{ gap: 7, marginTop: 2 }}>
          {ultra.features.map((f) => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={16} color="acText" />
              <Text v="b2">{f}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 12, paddingHorizontal: 20 }}>
        {rest.map((p) => (
          <View
            key={p.key}
            style={{ flex: 1, padding: 16, borderRadius: 20, gap: 4, backgroundColor: c.bg2, borderWidth: 1.5, borderColor: p.key === current ? c.line : 'transparent' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text v="h3">{p.key}</Text>
              {p.key === current ? <Badge label="지금 쓰는 중" /> : null}
            </View>
            <Text v="b1" weight="700">
              {p.monthly ? `${won(price(p.monthly))} / 월` : '무료'}
            </Text>
            <Text v="c1" color="t3">
              월 {p.credits.toLocaleString()} 크레딧
            </Text>
          </View>
        ))}
      </View>
      <Text v="c1" color="t3" style={{ paddingTop: 14, paddingHorizontal: 24 }}>
        {period === 'year' ? '연간 결제는 한 번에 청구돼요 · 언제든 해지할 수 있어요' : '매달 결제돼요 · 언제든 해지할 수 있어요'}
      </Text>
      <View style={{ marginTop: 22, marginHorizontal: 20 }}>
        <SettingsGroup>
          <SettingsRow
            label="크레딧 충전"
            sub={account.credits ? `남은 크레딧 ${(account.credits.total - account.credits.used).toLocaleString()}` : undefined}
            right={<Button label="충전" size="sm" variant="secondary" onPress={() => Alert.alert('크레딧 충전', '추가 구매는 곧 열려요. 지금은 요금제를 올려 크레딧을 늘릴 수 있어요.')} />}
          />
        </SettingsGroup>
      </View>
      <Note>매월 1일에 요금제 크레딧이 다시 채워져요.</Note>
    </Appear>
  )
}

import { brandColor } from '@push/shared'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { spacing, useColors } from '../../../theme'
import { Icon, Menu, SettingsGroup, Text } from '@/shared/components'
import { type Account } from '../api/schemas'
import { TONES, useMySettings, useUpdateSettings } from '@/features/my'
import { useAccessMode, useChatAccount, useChatDocs, useMe } from '../api/hooks'
import { ACCESS_MODES, ACCOUNT_REFERENCE_NOTE, ACCOUNT_REFERENCE_TITLE } from '../constants'
import { accessMenu, currentRole, toneLabel, toneMenu, usagePercent } from '../utils/account-menus'
import GroupTitle from './group-title'
import Mark from './mark'
import Note from './note'
import PageModal from './page-modal'


/** 계정 modal (ChatAccount). 플랜 opens as its own page (PlanUpgrade). */
export const AccountModal = () => {
  const account = useChatAccount(true)
  return (
    <PageModal title="계정" tight>
      <AccountPage account={account.data} onPlan={() => router.push('/plan')} />
    </PageModal>
  )
}

const AccountRow = ({ label, value, bold, onPress }: { label: string; value?: string; bold?: boolean; onPress?: () => void }) => {
  const body = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <Text v="b1" weight={bold ? '700' : undefined} style={{ flex: 1 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
        {value ? (
          <Text v="b2" color="t2">
            {value}
          </Text>
        ) : null}
        <Icon name="chev" size={16} color="t3" />
      </View>
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
  const toMy = () => router.navigate('/my')
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
              <AccountRow label={mode.row} />
            </View>
          </Menu>
        </SettingsGroup>
      </View>
    </>
  )
}

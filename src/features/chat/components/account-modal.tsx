import { brandColor } from '@push/shared'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { spacing } from '../../../theme'
import { Icon, Menu, SettingsGroup, Text } from '@/shared/components'
import { type Account } from '../api/schemas'
import { TONES, useMySettings, useUpdateSettings } from '@/features/my'
import { useChatAccount, useMe } from '../api/hooks'
import { ACCOUNT_REFERENCE_NOTE, DEFAULT_DOC, ACCOUNT_REFERENCE_TITLE } from '../constants'
import { currentRole, toneLabel, toneMenu, usagePercent } from '../utils/account-menus'
import GroupTitle from './group-title'
import Mark from './mark'
import Note from './note'
import PageModal from './page-modal'


export const AccountModal = () => {
  const account = useChatAccount(true)
  return (
    <PageModal title="계정" tight>
      <AccountPage account={account.data} onPlan={() => router.push('/plan')} onUsage={() => router.push('/usage')} />
    </PageModal>
  )
}

const AccountRow = ({ label, value, bold, plain, onPress }: { label: string; value?: string; bold?: boolean; plain?: boolean; onPress?: () => void }) => {
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
        {plain ? null : <Icon name="chev" size={16} color="t3" />}
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

const TITLE = { paddingTop: 22, paddingBottom: spacing[2], paddingHorizontal: spacing[6] } as const
const GROUP = { paddingHorizontal: spacing[5], marginTop: 14 } as const

const AccountPage = ({ account, onPlan, onUsage }: { account?: Account; onPlan: () => void; onUsage: () => void }) => {
  const me = useMe()
  const settings = useMySettings(true)
  const save = useUpdateSettings()
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
          {usage == null ? null : <AccountRow label={`이번 달 사용량 ${usage}%`} onPress={onUsage} />}
        </SettingsGroup>
      </View>
      <GroupTitle style={TITLE}>{ACCOUNT_REFERENCE_TITLE}</GroupTitle>
      <View style={{ paddingHorizontal: spacing[5] }}>
        <SettingsGroup>
          <AccountRow label={currentRole(me.profile) || '희망 직무'} onPress={toMy} />
          <AccountRow label={me.profile?.tenureYears != null ? `${me.profile.tenureYears}년차` : '연차'} onPress={toMy} />
          <AccountRow label={DEFAULT_DOC} onPress={toMy} />
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
        </SettingsGroup>
      </View>
    </>
  )
}

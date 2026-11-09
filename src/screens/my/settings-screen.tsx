import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native'
import type { Settings } from '@push/api-client'
import {
  Avatar,
  CONTACT,
  deleteAccountSession,
  AGENT_NOTE,
  AGENT_TITLE,
  BLOCKED_COPY,
  blockedCount,
  LANGS,
  NOTIFY_SUB,
  LOGIN_LABEL,
  NOTIFICATION_ROWS,
  REFERENCE_LABEL,
  REFERENCE_SUB,
  signOutSession,
  TONES,
  useAuthMe,
  useBlocked,
  useMyProfile,
  useReferenceConsent,
  useSettings,
  VISIBILITY,
  WITHDRAW_BODY,
} from '@/features/my'
import {
  Icon,
  Menu,
  SegmentedControl,
  SettingsGroup,
  SettingsRow,
  Switch,
  Text,
  TopBar,
} from '@/shared/components'
import { radius, spacing, THEME_CHOICES, useColors, useThemePreference } from '@/theme'
import { consentTurnedOff, grantConsent } from '@/features/chat'

const LanguageMenu = ({ value, onPick }: { value: Settings['locale']; onPick: (l: Settings['locale']) => void }) => {
  const c = useColors()
  const label = LANGS.find((l) => l.key === value)?.label
  return (
    <Menu
      accessibilityLabel={`언어 선택, ${label}`}
      actions={LANGS.map((l) => ({ key: l.key, label: l.label, selected: l.key === value, onPress: () => onPick(l.key) }))}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[1],
          height: 34,
          paddingHorizontal: spacing[3],
          borderRadius: radius.sm,
          backgroundColor: c.fill,
        }}
      >
        <Text v="b2" weight="600">
          {label}
        </Text>
        <Icon name="down" size={14} color="t1" />
      </View>
    </Menu>
  )
}

const Screen = ({ title, children }: { title: string; children: ReactNode }) => {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={title} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingTop: spacing[1], paddingHorizontal: spacing[5], paddingBottom: 48, gap: 22 }}
      >
        {children}
      </ScrollView>
    </View>
  )
}

const SettingsScreen = () => {
  const { s, set } = useSettings()
  const theme = useThemePreference((state) => state.choice)
  const setTheme = useThemePreference((state) => state.setChoice)
  const consent = useReferenceConsent()
  const { data: me } = useMyProfile()
  const { data: account } = useAuthMe()
  const blocked = useBlocked()
  const login = LOGIN_LABEL[account?.provider ?? ''] ?? ''
  if (!s) {
    return (
      <Screen title="설정">
        <ActivityIndicator style={{ marginTop: 40 }} />
      </Screen>
    )
  }
  const sw = (k: keyof Settings, label: string) => (
    <Switch label={label} value={!!s[k]} onValueChange={(v) => set({ [k]: v })} />
  )
  const logout = () =>
    Alert.alert('로그아웃할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void signOutSession() },
    ])
  const withdraw = () =>
    Alert.alert(
      '회원 탈퇴할까요?',
      WITHDRAW_BODY,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: () =>
            void deleteAccountSession().catch(() => Alert.alert('탈퇴하지 못했어요', '잠시 후 다시 시도해 주세요.')),
        },
      ],
    )

  return (
    <Screen title="설정">
      <SettingsGroup>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${me?.displayName ?? ''}, ${login}`}
          onPress={() => router.push('/edit-profile/basic')}
          style={{ minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
        >
          <Avatar name={me?.displayName ?? ''} url={me?.avatarUrl} />
          <View style={{ flex: 1 }}>
            <Text v="b1" weight="700">
              {me?.displayName}
            </Text>
            <Text v="c1" color="t3">
              {login}
            </Text>
          </View>
          <Icon name="chev" size={18} color="t4" />
        </Pressable>
      </SettingsGroup>

      <SettingsGroup title="일반" note="앱 화면과 에이전트 답변 언어가 함께 바뀌어요.">
        <SettingsRow
          label="언어"
          right={<LanguageMenu value={s.locale} onPick={(locale) => set({ locale })} />}
        />
        <SettingsRow
          label="테마"
          right={<SegmentedControl compact items={[...THEME_CHOICES]} value={theme} onChange={(k) => void setTheme(k)} />}
        />
      </SettingsGroup>

      <SettingsGroup title="알림">
        {NOTIFICATION_ROWS.map((row) => (
          <SettingsRow
            key={row.key}
            label={row.label}
            sub={NOTIFY_SUB[row.key]}
            right={sw(row.key, row.label)}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="허브 공개">
        <SettingsRow label="프로필 공개" right={sw('profilePublic', '프로필 공개')} />
        <SettingsRow
          label="커리어 상태"
          value={VISIBILITY.find((v) => v.key === s.careerStatusVisibility)?.label}
          onPress={() => router.push('/settings/visibility')}
        />
        <SettingsRow
          label="연락처"
          value={CONTACT.find((v) => v.key === s.contactVisibility)?.label ?? ''}
          onPress={() => router.push({ pathname: '/settings/pick', params: { kind: 'contact' } })}
        />
        <SettingsRow
          label={BLOCKED_COPY.title}
          value={blockedCount(blocked.data?.page.total)}
          onPress={() => router.push('/settings/blocked')}
        />
      </SettingsGroup>

      <SettingsGroup title={AGENT_TITLE} note={AGENT_NOTE}>
        <SettingsRow
          label="기본 말투"
          value={TONES.find((t) => t.key === s.defaultTone)?.label ?? ''}
          onPress={() => router.push({ pathname: '/settings/pick', params: { kind: 'tone' } })}
        />
        <SettingsRow
          label={REFERENCE_LABEL}
          sub={REFERENCE_SUB}
          right={
            <Switch
              label={REFERENCE_LABEL}
              value={!!consent.data?.referenceData}
              onValueChange={(v) =>
                consent.save(v, {
                  onSuccess: () => (v ? grantConsent() : consentTurnedOff()),
                })
              }
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="기타">
        {/* shortcut: support/terms URLs aren't decided yet; wire these rows when they are. */}
        <SettingsRow label="고객센터" right={<Icon name="chev" size={18} color="t4" />} />
        <SettingsRow label="약관 및 정책" right={<Icon name="chev" size={18} color="t4" />} />
        <SettingsRow label="로그아웃" danger onPress={logout} right={<View />} />
        <SettingsRow label="회원 탈퇴" danger onPress={withdraw} right={<View />} />
      </SettingsGroup>

    </Screen>
  )
}

export default SettingsScreen

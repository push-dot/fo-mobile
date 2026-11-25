import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, View } from 'react-native'
import { ApiError, type Settings } from '@push/api-client'
import {
  Avatar,
  deleteAccountSession,
  AGENT_NOTE,
  AGENT_TITLE,
  blockedRowLabel,
  careerRowLabel,
  contactRowLabel,
  LANGS,
  NOTIFY_SUB,
  LOGIN_LABEL,
  MARKETING_COPY,
  NOTIFICATION_ROWS,
  READ_FILES_ROW,
  RESTORE_PURCHASES_LABEL,
  REFERENCE_LABEL,
  REFERENCE_SUB,
  signOutSession,
  SUPPORT_MAIL,
  themeRowLabel,
  toneRowLabel,
  TONES,
  useAuthMe,
  useBlocked,
  useMarketingConsent,
  useMyProfile,
  useReferenceConsent,
  useSettings,
  WITHDRAW_BODY,
} from '@/features/my'
import {
  Icon,
  SettingsGroup,
  SettingsRow,
  Switch,
  Text,
  TopBar,
} from '@/shared/components'
import { openUrl } from '@/shared/infrastructure'
import { StyleSheet } from 'react-native-unistyles'
import { THEME_CHOICES, useThemePreference } from '@/theme'
import { usePersonalPurchase } from '@/features/billing'
import { consentTurnedOff, grantConsent } from '@/features/chat'

const IOS_PICKER = Platform.OS === 'ios'

const Screen = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={styles.screen}>
    <TopBar title={title} onBack={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
  </View>
)

const SettingsScreen = () => {
  const { s, set } = useSettings()
  const theme = useThemePreference((state) => state.choice)
  const consent = useReferenceConsent()
  const marketing = useMarketingConsent()
  const { data: me } = useMyProfile()
  const { data: account } = useAuthMe()
  const blocked = useBlocked()
  const purchase = usePersonalPurchase()
  const login = LOGIN_LABEL[account?.provider ?? ''] ?? ''
  if (!s) {
    return (
      <Screen title="설정">
        <ActivityIndicator style={styles.spinner} />
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
            void deleteAccountSession().catch((error: unknown) =>
              error instanceof ApiError && error.code === 'REAUTH_REQUIRED'
                ? Alert.alert('다시 로그인해 주세요', '탈퇴는 로그인한 지 10분 안에만 할 수 있어요. 다시 로그인한 뒤 탈퇴해 주세요.', [
                    { text: '다시 로그인', onPress: () => void signOutSession() },
                  ])
                : Alert.alert('탈퇴하지 못했어요', '잠시 후 다시 시도해 주세요.'),
            ),
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
          style={styles.profile}
        >
          <Avatar name={me?.displayName ?? ''} url={me?.avatarUrl} />
          <View style={styles.profileText}>
            <Text v="b1" weight="700">
              {me?.displayName}
            </Text>
            <Text v="c1" color="t3">
              {login}
            </Text>
          </View>
          <Icon name="chev" size={18} color="t1" />
        </Pressable>
      </SettingsGroup>

      <SettingsGroup title="일반" note="앱 화면과 Bot 답변 언어가 함께 바뀌어요.">
        <SettingsRow
          label={LANGS.find((l) => l.key === s.locale)?.label ?? ''}
          picker
          onPress={() => router.push({ pathname: '/settings/pick', params: { kind: 'locale' } })}
        />
        <SettingsRow
          label={themeRowLabel(THEME_CHOICES.find((t) => t.key === theme)?.label ?? '')}
          picker
          onPress={() => router.push({ pathname: '/settings/pick', params: { kind: 'theme' } })}
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
        <SettingsRow
          label={MARKETING_COPY.label}
          sub={MARKETING_COPY.sub}
          right={<Switch label={MARKETING_COPY.label} value={marketing.on} onValueChange={(v) => marketing.save(v)} />}
        />
      </SettingsGroup>

      <SettingsGroup title="허브 공개">
        <SettingsRow label="프로필 공개" right={sw('profilePublic', '프로필 공개')} />
        <SettingsRow label={careerRowLabel(s.careerStatusVisibility)} onPress={() => router.push('/settings/career')} mutedChevron />
        <SettingsRow label={contactRowLabel(s.contactVisibility)} onPress={() => router.push({ pathname: '/settings/pick', params: { kind: 'contact' } })} picker={IOS_PICKER} mutedChevron />
        <SettingsRow
          label={blockedRowLabel(blocked.data?.page.total)}
          mutedChevron
          onPress={() => router.push('/settings/blocked')}
        />
      </SettingsGroup>

      <SettingsGroup title={AGENT_TITLE} note={AGENT_NOTE}>
        <SettingsRow
          label={toneRowLabel(TONES.find((t) => t.key === s.defaultTone)?.label ?? '')}
          onPress={() => router.push({ pathname: '/settings/pick', params: { kind: 'tone' } })}
          picker={IOS_PICKER}
          mutedChevron
        />
        <SettingsRow label={READ_FILES_ROW.label} right={sw(READ_FILES_ROW.key, READ_FILES_ROW.label)} />
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
        <SettingsRow label="고객센터" onPress={() => void openUrl(SUPPORT_MAIL)} />
        <SettingsRow label="약관 및 정책" onPress={() => router.push('/settings/legal')} />
        <SettingsRow label={RESTORE_PURCHASES_LABEL} onPress={purchase.restore} right={<View />} />
        <SettingsRow label="로그아웃" danger onPress={logout} right={<View />} />
        <SettingsRow label="회원 탈퇴" danger onPress={withdraw} right={<View />} />
      </SettingsGroup>

    </Screen>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[5], paddingBottom: 48, gap: 22 },
  spinner: { marginTop: 40 },
  profile: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  profileText: { flex: 1 },
}))

export default SettingsScreen

import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native'
import type { Settings } from '@push/api-client'
import {
  Avatar,
  CONTACT,
  deleteAccountSession,
  LANGS,
  LOGIN_LABEL,
  RETENTION,
  signOutSession,
  TONES,
  useMyProfile,
  useSettings,
  VISIBILITY,
} from '@/features/my'
import {
  BottomSheet,
  Glass,
  Icon,
  SettingsGroup,
  SettingsRow,
  Switch,
  Text,
  TopBar,
} from '@/shared/components'
import { useColors } from '@/theme'

const Pick = <K extends string | number,>({
  title,
  items,
  value,
  onPick,
  visible,
  onClose,
}: {
  title: string
  items: { key: K; label: string }[]
  value: K
  onPick: (k: K) => void
  visible: boolean
  onClose: () => void
}) => {
  const c = useColors()
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {items.map((it) => {
        const on = it.key === value
        return (
          <Pressable
            key={String(it.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => {
              onPick(it.key)
              onClose()
            }}
            style={{
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: on ? c.acSoft : 'transparent',
            }}
          >
            <Text
              v="b1"
              weight={on ? '700' : '400'}
              color={on ? 'acText' : 't1'}
              style={{ flex: 1 }}
            >
              {it.label}
            </Text>
            {on ? <Icon name="check" size={18} color="acText" /> : null}
          </Pressable>
        )
      })}
    </BottomSheet>
  )
}

const LanguageSelect = ({
  value,
  onPick,
}: {
  value: Settings['locale']
  onPick: (l: Settings['locale']) => void
}) => {
  const c = useColors()
  const [at, setAt] = useState<{ top: number; right: number } | null>(null)
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`언어 선택, ${LANGS.find((l) => l.key === value)?.label}`}
        onPress={(e) =>
          setAt({ top: e.nativeEvent.pageY - e.nativeEvent.locationY + 42, right: 24 })
        }
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          height: 34,
          paddingLeft: 12,
          paddingRight: 10,
          borderRadius: 10,
          backgroundColor: c.fill,
        }}
      >
        <Text v="b2" weight="600">
          {LANGS.find((l) => l.key === value)?.label}
        </Text>
        <Icon name="down" size={14} color="t1" />
      </Pressable>
      <Modal visible={!!at} transparent animationType="fade" onRequestClose={() => setAt(null)}>
        <Pressable accessibilityLabel="닫기" style={{ flex: 1 }} onPress={() => setAt(null)} />
        {at ? (
          <Glass
            surface="sheet"
            style={{
              position: 'absolute',
              top: at.top,
              right: at.right,
              width: 200,
              padding: 6,
              borderRadius: 26,
              backgroundColor: c.card,
            }}
          >
            {LANGS.map((l) => (
              <Pressable
                key={l.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: l.key === value }}
                onPress={() => {
                  onPick(l.key)
                  setAt(null)
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  height: 44,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                }}
              >
                <View style={{ width: 18 }}>
                  {l.key === value ? <Icon name="check" size={18} /> : null}
                </View>
                <Text v="b1">{l.label}</Text>
              </Pressable>
            ))}
          </Glass>
        ) : null}
      </Modal>
    </>
  )
}

const Screen = ({ title, children }: { title: string; children: ReactNode }) => {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={title} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 48, gap: 22 }}
      >
        {children}
      </ScrollView>
    </View>
  )
}

const SettingsScreen = () => {
  const { s, set } = useSettings()
  const { data: me } = useMyProfile()
  const [sheet, setSheet] = useState<'contact' | 'tone' | 'retention' | null>(null)
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
      '유료 구독은 바로 해지돼요. 30일 안에 다시 로그인하면 계정이 복구되고, 30일이 지나면 이력서·서류·글·댓글이 모두 삭제돼요. 삭제된 뒤에는 되돌릴 수 없어요.',
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
          accessibilityLabel={`${me?.displayName ?? ''}, ${LOGIN_LABEL}`}
          onPress={() => router.push('/edit-profile/basic')}
          style={{ minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <Avatar name={me?.displayName ?? ''} url={me?.avatarUrl} />
          <View style={{ flex: 1 }}>
            <Text v="b1" weight="700">
              {me?.displayName}
            </Text>
            <Text v="c1" color="t3">
              {LOGIN_LABEL}
            </Text>
          </View>
          <Icon name="chev" size={18} color="t4" />
        </Pressable>
      </SettingsGroup>

      <SettingsGroup title="일반" note="앱 화면과 AI 답변 언어가 함께 바뀌어요.">
        <SettingsRow
          label="언어"
          right={<LanguageSelect value={s.locale} onPick={(locale) => set({ locale })} />}
        />
      </SettingsGroup>

      <SettingsGroup title="알림">
        <SettingsRow
          label="마감 임박 공고"
          sub="북마크한 공고 마감 3일 전"
          right={sw('notifyDeadline', '마감 임박 공고')}
        />
        <SettingsRow label="제안 받음" right={sw('notifyOffer', '제안 받음')} />
        <SettingsRow label="댓글과 답글" right={sw('notifyComment', '댓글과 답글')} />
        <SettingsRow
          label="AI 작업 완료"
          sub="앱을 닫아도 끝나면 알려 드려요"
          right={sw('notifyAiDone', 'AI 작업 완료')}
        />
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
          onPress={() => setSheet('contact')}
        />
      </SettingsGroup>

      <SettingsGroup
        title="AI 채팅"
        note="마이 이력서와 북마크 공고를 AI가 읽어서 이력서를 고쳐요. 끄면 매번 직접 첨부해야 해요."
      >
        <SettingsRow
          label="기본 말투"
          value={TONES.find((t) => t.key === s.defaultTone)?.label ?? ''}
          onPress={() => setSheet('tone')}
        />
        <SettingsRow
          label="대화 기록 보관"
          value={
            RETENTION.find((r) => r.key === (s.chatRetentionDays ?? 0))?.label ??
            `${s.chatRetentionDays}일`
          }
          onPress={() => setSheet('retention')}
        />
        <SettingsRow
          label="내 자료 읽기 허용"
          right={sw('allowAiReadMyFiles', '내 자료 읽기 허용')}
        />
      </SettingsGroup>

      <SettingsGroup title="기타">
        {/* shortcut: support/terms URLs aren't decided yet; wire these rows when they are. */}
        <SettingsRow label="고객센터" right={<Icon name="chev" size={18} color="t4" />} />
        <SettingsRow label="약관 및 정책" right={<Icon name="chev" size={18} color="t4" />} />
        <SettingsRow label="로그아웃" danger onPress={logout} right={<View />} />
        <SettingsRow label="회원 탈퇴" danger onPress={withdraw} right={<View />} />
      </SettingsGroup>

      <Pick
        title="누구에게 연락처를 보여 줄까요?"
        items={CONTACT}
        value={s.contactVisibility}
        onPick={(contactVisibility) => set({ contactVisibility })}
        visible={sheet === 'contact'}
        onClose={() => setSheet(null)}
      />
      <Pick
        title="AI가 어떤 말투로 쓸까요?"
        items={TONES}
        value={s.defaultTone}
        onPick={(defaultTone) => set({ defaultTone })}
        visible={sheet === 'tone'}
        onClose={() => setSheet(null)}
      />
      <Pick
        title="대화 기록을 얼마나 보관할까요?"
        items={RETENTION}
        value={s.chatRetentionDays ?? 0}
        onPick={(d) => set({ chatRetentionDays: d || null })}
        visible={sheet === 'retention'}
        onClose={() => setSheet(null)}
      />
    </Screen>
  )
}

export default SettingsScreen

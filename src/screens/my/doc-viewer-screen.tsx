import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { JOB_CATEGORIES, type Profile } from '@push/api-client'
import {
  DocMenu,
  FileTile,
  fileSize,
  monthDay,
  overwriteWarning,
  tenureLabel,
  useApplyResumeProfile,
  useMyProfile,
  useResumeDraft,
  useSource,
  type ResumeDraft,
} from '@/features/my'
import { Badge, BottomSheet, Button, GlassButton, Icon, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

type Part = 'basic' | 'intro' | 'career' | 'skills'
const PARTS: { key: Part; label: string }[] = [
  { key: 'basic', label: '기본 정보' },
  { key: 'intro', label: '소개' },
  { key: 'career', label: '경력' },
  { key: 'skills', label: '기술 스택' },
]

const summary = (key: Part, d: ResumeDraft['profile']) => {
  switch (key) {
    case 'basic':
      return `이름 · 헤드라인 · ${JOB_CATEGORIES.find((j) => j.key === d.jobCategory)?.label ?? ''} ${tenureLabel(d.tenureYears)}`
    case 'intro':
      return d.intro
    case 'career':
      return `${d.careers.map((c) => c.company).join(', ')} · ${d.careers.length}건`
    case 'skills':
      return d.skills.length > 2
        ? `${d.skills.slice(0, 2).join(', ')} 외 ${d.skills.length - 2}개`
        : d.skills.join(', ')
  }
}

const patchFor = (picked: Part[], d: ResumeDraft['profile']): Partial<Profile> => ({
  ...(picked.includes('basic')
    ? {
        displayName: d.displayName,
        headline: d.headline,
        jobCategory: d.jobCategory,
        tenureYears: d.tenureYears,
      }
    : {}),
  ...(picked.includes('intro') ? { intro: d.intro } : {}),
  ...(picked.includes('career') ? { careers: d.careers } : {}),
  ...(picked.includes('skills') ? { skills: d.skills } : {}),
})

const ToProfileSheet = ({
  draft,
  visible,
  onClose,
}: {
  draft: ResumeDraft['profile']
  visible: boolean
  onClose: () => void
}) => {
  const c = useColors()
  const { data: current } = useMyProfile()
  const [picked, setPicked] = useState<Part[]>(['basic', 'intro', 'career'])
  const apply = useApplyResumeProfile(onClose)
  const filled: Record<Part, boolean> = {
    basic: false,
    intro: !!current?.intro,
    career: !!current?.careers.length,
    skills: !!current?.skills.length,
  }
  const warning = overwriteWarning(
    PARTS.filter((p) => picked.includes(p.key) && filled[p.key]).map((p) => p.label),
  )
  const toggle = (k: Part) =>
    setPicked((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]))

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="이 이력서로 프로필을 채울까요?"
      description="고른 항목만 허브 프로필에 반영돼요. 반영한 뒤에도 섹션별로 고칠 수 있어요."
      action={{
        label: apply.isPending ? '반영하는 중' : `${picked.length}개 항목 반영하기`,
        onPress: () => apply.mutate(patchFor(picked, draft)),
        disabled: !picked.length || apply.isPending,
      }}
    >
      <View>
        {PARTS.map((p) => {
          const on = picked.includes(p.key)
          return (
            <Pressable
              key={p.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(p.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.ac : 'transparent',
                  borderWidth: on ? 0 : 2,
                  borderColor: c.t4,
                }}
              >
                {on ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text v="b1" weight="600">
                  {p.label}
                </Text>
                <Text v="c1" color="t3" numberOfLines={1}>
                  {summary(p.key, draft)}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
      {warning ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: c.orangeSoft,
          }}
        >
          <Text v="c1" weight="800" color="orange">
            !
          </Text>
          <Text v="c1" style={{ flex: 1 }}>
            {warning}
          </Text>
        </View>
      ) : null}
    </BottomSheet>
  )
}

const Paper = ({ d }: { d: ResumeDraft }) => {
  const c = useColors()
  const p = d.profile
  const head = (t: string) => (
    <Text
      weight="800"
      style={{
        fontSize: 11,
        lineHeight: 14,
        color: c.acText,
        borderBottomWidth: 1,
        borderBottomColor: c.line,
        paddingBottom: 3,
        marginTop: 6,
      }}
    >
      {t}
    </Text>
  )
  return (
    <View
      accessibilityLabel={`${p.displayName} 서류 미리보기`}
      style={{
        width: '100%',
        aspectRatio: 1 / 1.414,
        backgroundColor: c.paper,
        borderRadius: 6,
        padding: 20,
        gap: 7,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <Text weight="800" style={{ fontSize: 19, lineHeight: 24 }}>
        {p.displayName}
      </Text>
      <Text color="t3" style={{ fontSize: 10, lineHeight: 13 }}>
        {[d.email, ...d.links].filter(Boolean).join(' · ')}
      </Text>
      <Text color="t2" style={{ fontSize: 10.5, lineHeight: 15 }}>
        {p.intro}
      </Text>
      {head('경력')}
      {p.careers.map((cr) => (
        <View key={`${cr.company}-${cr.startedOn}`} style={{ gap: 2 }}>
          <Text weight="700" style={{ fontSize: 11, lineHeight: 15 }}>
            {cr.company} · {cr.role}{' '}
            <Text color="t3" style={{ fontSize: 11 }}>
              {cr.startedOn.replace('-', '.')} – {cr.endedOn?.replace('-', '.') ?? '현재'}
            </Text>
          </Text>
          {cr.description ? (
            <Text color="t2" style={{ fontSize: 10, lineHeight: 14 }}>
              {cr.description}
            </Text>
          ) : null}
        </View>
      ))}
      {head('기술 스택')}
      <Text color="t2" style={{ fontSize: 10, lineHeight: 14 }}>
        {p.skills.join(' · ')}
      </Text>
    </View>
  )
}

const DocViewerScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [sheet, setSheet] = useState(false)
  const [menu, setMenu] = useState(false)
  const doc = useSource(id)
  const draft = useResumeDraft(id)
  const s = doc.data
  const d = draft.data

  return (
    <View style={{ flex: 1, backgroundColor: c.bg2 }}>
      <TopBar
        title={s?.fileName ?? '서류 보기'}
        onBack={() => router.back()}
        right={
          <GlassButton
            actions={[
              // shortcut: Source has no download URL yet, so 공유 shares the file name; share the file once push-be returns a URL.
              {
                icon: 'share',
                label: '공유',
                onPress: () => s && void Share.share({ message: s.fileName }),
              },
              { icon: 'more', label: '더 보기', onPress: () => setMenu(true) },
            ]}
          />
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {s ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <FileTile name={s.fileName} small />
            <Text v="c1" color="t3" style={{ flex: 1 }}>
              {fileSize(s.size)}
              {d ? ` · ${d.pageCount}쪽` : ''}
              {s.createdAt ? ` · ${monthDay(s.createdAt)} 등록` : ''}
            </Text>
            {d ? <Badge label={`1 / ${d.pageCount}`} tone="grey" /> : null}
          </View>
        ) : null}
        <View style={{ paddingTop: 4, paddingHorizontal: 36 }}>
          {d ? (
            <Paper d={d} />
          ) : draft.isPending ? (
            <ActivityIndicator style={{ marginTop: 60 }} />
          ) : (
            <Text v="b2" color="t3" style={{ marginTop: 60, textAlign: 'center' }}>
              미리보기는 곧 볼 수 있어요
            </Text>
          )}
        </View>
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingTop: 14,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 10,
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.line,
        }}
      >
        <Button
          label="AI로 고치기"
          icon="spark"
          variant="secondary"
          onPress={() => router.push('/(tabs)/(chat)/chat')}
        />
        <Button
          label="내 프로필로 전환"
          icon="user"
          disabled={!d}
          onPress={() => setSheet(true)}
          style={{ flex: 1 }}
        />
      </View>
      {d ? (
        <ToProfileSheet draft={d.profile} visible={sheet} onClose={() => setSheet(false)} />
      ) : null}
      <DocMenu
        doc={menu ? (s ?? null) : null}
        viewing
        onClose={() => setMenu(false)}
        onDeleted={() => router.back()}
      />
    </View>
  )
}

export default DocViewerScreen

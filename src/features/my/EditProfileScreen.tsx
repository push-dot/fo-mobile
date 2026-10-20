import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  CAREER_STATUSES,
  JOB_CATEGORIES,
  type Career,
  type CareerStatus,
  type JobCategory,
  type Profile,
} from '@push/api-client'
import { searchHangul } from '../../lib/hangul-search'
import { api } from '../../lib/api'
import { fontFor, radius, useColors } from '../../theme'
import { BottomSheet, Button, Icon, SegmentedControl, Switch, Text, TextField } from '../../ui'
import { careerPeriod, parseYm, tenureLabel } from './lib'
import { Avatar, FieldLabel, SheetHeader } from './parts'
import { useMyProfile, type ProfileSection } from './ProfileTab'
import { SKILL_CATALOG } from './skills'

type Patch = Partial<Profile> & { avatarKey?: string }
const TITLES: Record<ProfileSection, string> = {
  basic: '기본 정보',
  intro: '소개',
  career: '경력',
  skills: '기술 스택',
}

const useSave = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Patch) => api.me.updateProfile(patch),
    onSuccess: (p) => {
      qc.setQueryData(['me', 'profile'], p)
      router.back()
    },
    onError: () => Alert.alert('저장하지 못했어요', '잠시 뒤에 다시 저장해 주세요.'),
  })
}

/** Plain input on bg, used inside bg2 cards and select fields. */
function Input({
  value,
  onChangeText,
  label,
  placeholder,
  multiline,
  keyboardType,
}: {
  value: string
  onChangeText: (t: string) => void
  label: string
  placeholder?: string
  multiline?: boolean
  keyboardType?: 'numbers-and-punctuation'
}) {
  const c = useColors()
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? label}
      placeholderTextColor={c.t4}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[
        {
          minHeight: multiline ? 72 : 48,
          borderRadius: radius.md,
          backgroundColor: c.bg,
          paddingHorizontal: 16,
          paddingTop: multiline ? 12 : 0,
          fontSize: 16,
          color: c.t1,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        fontFor('400'),
      ]}
    />
  )
}

/** Field-looking button that opens a picker sheet. */
function SelectField({
  label,
  value,
  onPress,
}: {
  label: string
  value: string
  onPress: () => void
}) {
  const c = useColors()
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${value}`}
        onPress={onPress}
        style={{
          minHeight: 56,
          borderRadius: radius.md,
          backgroundColor: c.fill,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text v="b1">{value}</Text>
        <Icon name="down" size={18} color="t3" />
      </Pressable>
    </View>
  )
}

function PickSheet<K extends string | number>({
  title,
  items,
  value,
  onPick,
  onClose,
  visible,
}: {
  title: string
  items: { key: K; label: string }[]
  value: K | null
  onPick: (k: K) => void
  onClose: () => void
  visible: boolean
}) {
  const c = useColors()
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {items.map((it) => (
        <Pressable
          key={it.key}
          accessibilityRole="button"
          accessibilityState={{ selected: it.key === value }}
          onPress={() => (onPick(it.key), onClose())}
          style={{
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: it.key === value ? c.acSoft : 'transparent',
          }}
        >
          <Text
            v="b1"
            weight={it.key === value ? '700' : '400'}
            color={it.key === value ? 'acText' : 't1'}
            style={{ flex: 1 }}
          >
            {it.label}
          </Text>
          {it.key === value ? <Icon name="check" size={18} color="acText" /> : null}
        </Pressable>
      ))}
    </BottomSheet>
  )
}

const YEARS = Array.from({ length: 21 }, (_, n) => ({
  key: n,
  label: n === 20 ? '20년차 이상' : tenureLabel(n),
}))

function EditBasic({ p }: { p: Profile }) {
  const c = useColors()
  const save = useSave()
  const [name, setName] = useState(p.displayName)
  const [headline, setHeadline] = useState(p.headline)
  const [job, setJob] = useState<JobCategory | null>(p.jobCategory)
  const [years, setYears] = useState(p.tenureYears)
  const [status, setStatus] = useState<CareerStatus | null>(p.careerStatus)
  const [offers, setOffers] = useState(p.openToOffers)
  const [photo, setPhoto] = useState<{ uri: string; key?: string } | null>(null)
  const [sheet, setSheet] = useState<'job' | 'years' | null>(null)

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    const a = res.canceled ? null : res.assets[0]
    if (!a) return
    setPhoto({ uri: a.uri })
    const form = new FormData()
    form.append('file', {
      uri: a.uri,
      name: a.fileName ?? 'avatar.jpg',
      type: a.mimeType ?? 'image/jpeg',
    } as unknown as Blob)
    try {
      const { key } = await api.uploads.image(form)
      setPhoto({ uri: a.uri, key })
    } catch {
      setPhoto(null)
      Alert.alert('사진을 올리지 못했어요', '잠시 뒤에 다시 골라 주세요.')
    }
  }

  const uploading = !!photo && !photo.key
  return (
    <>
      <SheetHeader
        title={TITLES.basic}
        saving={save.isPending}
        canSave={!!name.trim() && !uploading}
        onSave={() =>
          save.mutate({
            displayName: name.trim(),
            headline: headline.trim(),
            jobCategory: job,
            tenureYears: years,
            careerStatus: status,
            openToOffers: offers,
            ...(photo?.key ? { avatarKey: photo.key } : {}),
          })
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필 사진 바꾸기"
            onPress={() => void pickPhoto()}
          >
            <Avatar name={name || p.displayName} url={photo?.uri ?? p.avatarUrl} size={64} />
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: c.t1,
                borderWidth: 2,
                borderColor: c.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={c.bg} />
              ) : (
                <Icon name="edit" size={12} color={c.bg} />
              )}
            </View>
          </Pressable>
          <Text v="c1" color="t3">
            {'사진은 허브 프로필과\n이력서 템플릿에 함께 쓰여요.'}
          </Text>
        </View>
        <View style={{ gap: 8 }}>
          <FieldLabel>이름</FieldLabel>
          <TextField accessibilityLabel="이름" value={name} onChangeText={setName} maxLength={20} />
        </View>
        <View style={{ gap: 8 }}>
          <FieldLabel>헤드라인</FieldLabel>
          <View>
            <TextField
              accessibilityLabel="헤드라인"
              value={headline}
              onChangeText={setHeadline}
              maxLength={40}
              style={{ paddingRight: 44 }}
            />
            <Text v="c2" color="t3" style={{ position: 'absolute', right: 16, top: 20 }}>
              {headline.length}/40
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SelectField
            label="직군"
            value={JOB_CATEGORIES.find((j) => j.key === job)?.label ?? ''}
            onPress={() => setSheet('job')}
          />
          <SelectField
            label="연차"
            value={years == null ? '' : YEARS[Math.min(years, 20)]!.label}
            onPress={() => setSheet('years')}
          />
        </View>
        <View style={{ gap: 8 }}>
          <FieldLabel>커리어 상태</FieldLabel>
          <SegmentedControl items={CAREER_STATUSES} value={status} onChange={setStatus} />
        </View>
        <View
          style={{
            minHeight: 56,
            borderRadius: radius.md,
            backgroundColor: c.fill,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text v="b1">제안 받기</Text>
            <Text v="c1" color="t3">
              허브에서 다른 사람이 제안을 보낼 수 있어요
            </Text>
          </View>
          <Switch label="제안 받기" value={offers} onValueChange={setOffers} />
        </View>
      </ScrollView>
      <PickSheet
        title="어떤 직군인가요?"
        items={JOB_CATEGORIES}
        value={job}
        onPick={setJob}
        visible={sheet === 'job'}
        onClose={() => setSheet(null)}
      />
      <PickSheet
        title="몇 년차인가요?"
        items={YEARS}
        value={Math.min(years ?? 0, 20)}
        onPick={setYears}
        visible={sheet === 'years'}
        onClose={() => setSheet(null)}
      />
    </>
  )
}

function EditIntro({ p }: { p: Profile }) {
  const save = useSave()
  const [intro, setIntro] = useState(p.intro)
  return (
    <>
      <SheetHeader
        title={TITLES.intro}
        saving={save.isPending}
        onSave={() => save.mutate({ intro: intro.trim() })}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          accessibilityLabel="소개"
          multiline
          max={500}
          value={intro}
          onChangeText={setIntro}
          style={{ minHeight: 200, lineHeight: 25 }}
          placeholder="어떤 일을 해 왔고, 요즘 무엇에 관심 있는지 적어 보세요."
        />
        {/* shortcut: no inline rewrite API yet, so 다듬기 hands off to AI 채팅; add one when push-be ships it */}
        <Button
          label="AI로 다듬기"
          icon="spark"
          variant="secondary"
          onPress={() => router.push('/(tabs)/(chat)/chat')}
        />
        <Text v="c1" color="t3">
          허브 프로필 맨 위에 보여요. 3~4문장이면 충분해요.
        </Text>
      </ScrollView>
    </>
  )
}

type CareerDraft = {
  company: string
  role: string
  start: string
  end: string
  current: boolean
  description: string
}
const toDraft = (c: Career): CareerDraft => ({
  company: c.company,
  role: c.role,
  start: c.startedOn.replace('-', '.'),
  end: c.endedOn?.replace('-', '.') ?? '',
  current: !c.endedOn,
  description: c.description,
})
const toCareer = (d: CareerDraft): Career | null => {
  const startedOn = parseYm(d.start)
  const endedOn = d.current ? null : parseYm(d.end)
  if (!d.company.trim() || !d.role.trim() || !startedOn || (!d.current && !endedOn)) return null
  return {
    company: d.company.trim(),
    role: d.role.trim(),
    startedOn,
    endedOn,
    description: d.description.trim(),
  }
}

function EditCareer({ p }: { p: Profile }) {
  const c = useColors()
  const save = useSave()
  const [items, setItems] = useState<CareerDraft[]>(p.careers.map(toDraft))
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null)
  const parsed = items.map(toCareer)
  const set = (i: number, patch: Partial<CareerDraft>) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  // shortcut: no drag library installed, so the grip moves an item up one place; swap for drag-to-reorder if one is added.
  const moveUp = (i: number) => {
    if (i === 0) return
    setItems((xs) => {
      const next = [...xs]
      ;[next[i - 1], next[i]] = [next[i]!, next[i - 1]!]
      return next
    })
    setOpen((o) => (o === i ? i - 1 : o === i - 1 ? i : o))
  }

  return (
    <>
      <SheetHeader
        title={TITLES.career}
        saving={save.isPending}
        canSave={parsed.every(Boolean)}
        onSave={() => save.mutate({ careers: parsed as Career[] })}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((it, i) => {
          const expanded = open === i
          const valid = parsed[i]
          return (
            <View key={i} style={{ padding: 16, borderRadius: 18, backgroundColor: c.bg2, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="위로 옮기기"
                  disabled={i === 0}
                  onPress={() => moveUp(i)}
                  hitSlop={10}
                >
                  <Icon name="menu" size={18} color="t4" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpen(expanded ? null : i)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    minHeight: 32,
                  }}
                >
                  <Text v="b1" weight="700" numberOfLines={1} style={{ flex: 1 }}>
                    {it.company || '새 경력'}
                    {it.role ? ` · ${it.role}` : ''}
                  </Text>
                  <Icon name={expanded ? 'up' : 'down'} size={18} color="t3" />
                </Pressable>
              </View>
              <Text v="c1" color={valid ? 't3' : 'red'} style={{ paddingLeft: 26 }}>
                {valid ? careerPeriod(valid) : '회사, 직무, 기간을 채워 주세요'}
              </Text>
              {expanded ? (
                <View style={{ gap: 8, paddingTop: 8 }}>
                  <Input
                    label="회사"
                    value={it.company}
                    onChangeText={(t) => set(i, { company: t })}
                  />
                  <Input label="직무" value={it.role} onChangeText={(t) => set(i, { role: t })} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="시작"
                        placeholder="시작 (2022.03)"
                        keyboardType="numbers-and-punctuation"
                        value={it.start}
                        onChangeText={(t) => set(i, { start: t })}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1,
                        minHeight: 48,
                        borderRadius: radius.md,
                        backgroundColor: c.bg,
                        paddingLeft: 16,
                        paddingRight: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text v="b1">재직 중</Text>
                      <Switch
                        label="재직 중"
                        value={it.current}
                        onValueChange={(v) => set(i, { current: v })}
                      />
                    </View>
                  </View>
                  {!it.current ? (
                    <Input
                      label="종료"
                      placeholder="종료 (2024.02)"
                      keyboardType="numbers-and-punctuation"
                      value={it.end}
                      onChangeText={(t) => set(i, { end: t })}
                    />
                  ) : null}
                  <Input
                    label="한 줄 설명"
                    multiline
                    value={it.description}
                    onChangeText={(t) => set(i, { description: t })}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setItems((xs) => xs.filter((_, j) => j !== i))
                      setOpen(null)
                    }}
                    style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
                  >
                    <Text v="b2" weight="600" color="red">
                      이 경력 삭제하기
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )
        })}
        <Button
          label="경력 추가"
          icon="plus"
          variant="secondary"
          onPress={() => {
            setItems((xs) => [
              ...xs,
              { company: '', role: '', start: '', end: '', current: true, description: '' },
            ])
            setOpen(items.length)
          }}
        />
      </ScrollView>
    </>
  )
}

function EditSkills({ p }: { p: Profile }) {
  const c = useColors()
  const save = useSave()
  const [skills, setSkills] = useState(p.skills)
  const [q, setQ] = useState('')
  const has = (s: string) => skills.some((x) => x.toLowerCase() === s.toLowerCase())
  const hits = q.trim()
    ? searchHangul(
        SKILL_CATALOG.filter((s) => !has(s)),
        q,
        (s) => [s],
      ).slice(0, 5)
    : []
  const add = (s: string) => {
    const v = s.trim()
    if (v && !has(v)) setSkills((xs) => [...xs, v])
    setQ('')
  }
  const moveEarlier = (i: number) =>
    i > 0 && setSkills((xs) => [...xs.slice(0, i - 1), xs[i]!, xs[i - 1]!, ...xs.slice(i + 1)])

  return (
    <>
      <SheetHeader
        title={TITLES.skills}
        saving={save.isPending}
        onSave={() => save.mutate({ skills })}
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          icon="search"
          accessibilityLabel="기술 검색"
          placeholder="기술 검색"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => add(hits[0]?.item ?? q)}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {hits.length ? (
          <View
            style={{
              marginTop: -6,
              borderRadius: 16,
              backgroundColor: c.bg2,
              paddingVertical: 4,
              paddingHorizontal: 6,
            }}
          >
            {hits.map(({ item, match }) => {
              const [a, b] = match ? [match.start, match.end] : [0, 0]
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`${item} 추가`}
                  onPress={() => add(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    height: 44,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                  }}
                >
                  <Icon name="plus" size={16} color="t3" />
                  <Text v="b1">
                    {item.slice(0, a)}
                    <Text v="b1" weight="700" color="acText">
                      {item.slice(a, b)}
                    </Text>
                    {item.slice(b)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
        <Text v="b2" weight="700" style={{ marginTop: 6 }}>
          내 기술 {skills.length}개
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {skills.map((s, i) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              accessibilityLabel={`${s} 삭제`}
              accessibilityHint="길게 누르면 앞으로 옮겨요"
              onPress={() => setSkills((xs) => xs.filter((x) => x !== s))}
              onLongPress={() => moveEarlier(i)}
              style={{
                height: 34,
                borderRadius: 17,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: c.t1,
              }}
            >
              <Text v="c1" weight="600" style={{ fontSize: 14, color: c.bg }}>
                {s}
              </Text>
              <Icon name="x" size={12} color={c.bg} />
            </Pressable>
          ))}
        </View>
        {/* shortcut: long press moves a chip one place earlier (no drag library installed). */}
        <Text v="c1" color="t3">
          길게 눌러 순서를 바꿀 수 있어요. 앞의 5개가 허브 목록에 보여요.
        </Text>
      </ScrollView>
    </>
  )
}

/** Per-section profile edit sheet (기본 정보 · 소개 · 경력 · 기술 스택). Saves only that section. */
export function EditProfileScreen({ section }: { section: ProfileSection }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { data: p } = useMyProfile()
  const Form =
    { basic: EditBasic, intro: EditIntro, career: EditCareer, skills: EditSkills }[section] ??
    EditBasic
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        flex: 1,
        backgroundColor: c.bg,
        paddingTop: Platform.OS === 'android' ? insets.top : 0,
        paddingBottom: insets.bottom,
      }}
    >
      {p ? <Form p={p} /> : <ActivityIndicator style={{ marginTop: 60 }} />}
    </KeyboardAvoidingView>
  )
}

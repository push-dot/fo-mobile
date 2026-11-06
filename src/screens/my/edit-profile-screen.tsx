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
import {
  Avatar,
  careerDeleteBody,
  careerDeleteCopy,
  careerPeriod,
  FieldLabel,
  AVATAR_IMAGE_OPTIONS,
  skillOrderHint,
  parseYm,
  dateToYm,
  ymToDate,
  SheetHeader,
  SKILL_CATALOG,
  tenureLabel,
  uploadAvatarImage,
  useMyProfile,
  useSaveProfile,
  type ProfileSection,
} from '@/features/my'
import {
  askConfirm,
  Button,
  Chip,
  DatePicker,
  Icon,
  Menu,
  SegmentedControl,
  showToast,
  SkeletonRows,
  Switch,
  Text,
  TextField,
  ToastHost,
  type MenuAction,
} from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { pickImage } from '@/shared/infrastructure'
import { searchHangul } from '@push/shared'
import { fontFor, hitSlopTo, radius, spacing, type, useColors } from '@/theme'

const CAREER_MISSING = '회사, 직무, 기간을 채워 주세요'


const FORM = { paddingHorizontal: spacing[5], paddingBottom: spacing[6], gap: spacing[4] } as const

const LOADING_ROWS = {
  count: 4,
  lead: { size: 48, radius: radius.pill },
  lines: [
    { width: '60%', height: 16 },
    { width: '40%', height: 12 },
  ],
} as const

const TITLES: Record<ProfileSection, string> = {
  basic: '기본 정보',
  intro: '소개',
  career: '경력',
  skills: '기술 스택',
}

const Input = ({
  value,
  onChangeText,
  label,
  placeholder,
  multiline,
  keyboardType,
  invalid,
}: {
  value: string
  onChangeText: (t: string) => void
  label: string
  placeholder?: string
  multiline?: boolean
  keyboardType?: 'numbers-and-punctuation'
  invalid?: boolean
}) => {
  const c = useColors()
  const font = multiline ? type.b2 : type.b1
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
          ...inputReset,
          minHeight: multiline ? 72 : 48,
          borderRadius: radius.md,
          backgroundColor: c.bg,
          borderWidth: 1.5,
          borderColor: invalid ? c.red : 'transparent',
          paddingHorizontal: spacing[4],
          paddingTop: multiline ? spacing[3] : 0,
          fontSize: font.fontSize,
          lineHeight: font.lineHeight,
          letterSpacing: font.letterSpacing,
          color: c.t1,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        fontFor('400'),
      ]}
    />
  )
}

const SelectField = ({
  label,
  value,
  actions,
}: {
  label: string
  value: string
  actions: MenuAction[]
}) => {
  const c = useColors()
  return (
    <View style={{ flex: 1, gap: spacing[2] }}>
      <FieldLabel>{label}</FieldLabel>
      <Menu actions={actions} accessibilityLabel={`${label} ${value}`} stretch>
        <View
          style={{
            minHeight: 56,
            borderRadius: radius.md,
            backgroundColor: c.fill,
            paddingHorizontal: spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text v="b1">{value}</Text>
          <Icon name="down" size={18} color="t3" />
        </View>
      </Menu>
    </View>
  )
}

const YEARS = Array.from({ length: 21 }, (_, n) => ({
  key: n,
  label: n === 20 ? '20년차 이상' : tenureLabel(n),
}))

const EditBasic = ({ p }: { p: Profile }) => {
  const c = useColors()
  const save = useSaveProfile()
  const [name, setName] = useState(p.displayName)
  const [headline, setHeadline] = useState(p.headline)
  const [job, setJob] = useState<JobCategory | null>(p.jobCategory)
  const [years, setYears] = useState(p.tenureYears)
  const [status, setStatus] = useState<CareerStatus | null>(p.careerStatus)
  const [offers, setOffers] = useState(p.openToOffers)
  const [photo, setPhoto] = useState<{ uri: string; key?: string } | null>(null)

  const pickPhoto = async () => {
    const res = await pickImage(AVATAR_IMAGE_OPTIONS)
    const a = res.canceled ? null : res.assets[0]
    if (!a) return
    setPhoto({ uri: a.uri })
    try {
      const { key } = await uploadAvatarImage(a)
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
        contentContainerStyle={FORM}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
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
                borderRadius: radius.sm,
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
        <View style={{ gap: spacing[2] }}>
          <FieldLabel>이름</FieldLabel>
          <TextField accessibilityLabel="이름" value={name} onChangeText={setName} maxLength={20} />
        </View>
        <View style={{ gap: spacing[2] }}>
          <FieldLabel>헤드라인</FieldLabel>
          <View>
            <TextField
              accessibilityLabel="헤드라인"
              value={headline}
              onChangeText={setHeadline}
              maxLength={40}
              style={{ paddingRight: 44 }}
            />
            <View pointerEvents="none" style={{ position: 'absolute', right: spacing[4], top: 0, bottom: 0, justifyContent: 'center' }}>
              <Text v="c2" color="t3">
                {headline.length}/40
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <SelectField
            label="직군"
            value={JOB_CATEGORIES.find((j) => j.key === job)?.label ?? ''}
            actions={JOB_CATEGORIES.map((j) => ({
              key: j.key,
              label: j.label,
              selected: j.key === job,
              onPress: () => setJob(j.key),
            }))}
          />
          <SelectField
            label="연차"
            value={years == null ? '' : YEARS[Math.min(years, 20)]!.label}
            actions={YEARS.map((y) => ({
              key: String(y.key),
              label: y.label,
              selected: y.key === Math.min(years ?? -1, 20),
              onPress: () => setYears(y.key),
            }))}
          />
        </View>
        <View style={{ gap: spacing[2] }}>
          <FieldLabel>커리어 상태</FieldLabel>
          <SegmentedControl items={CAREER_STATUSES} value={status} onChange={setStatus} />
        </View>
        <View
          style={{
            minHeight: 56,
            borderRadius: radius.md,
            backgroundColor: c.fill,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
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
    </>
  )
}

const EditIntro = ({ p }: { p: Profile }) => {
  const save = useSaveProfile()
  const [intro, setIntro] = useState(p.intro)
  return (
    <>
      <SheetHeader
        title={TITLES.intro}
        saving={save.isPending}
        onSave={() => save.mutate({ intro: intro.trim() })}
      />
      <ScrollView
        contentContainerStyle={FORM}
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
          label="에이전트로 다듬기"
          icon="spark"
          variant="secondary"
          size="md"
          onPress={() => router.push('/(app)/(stack)/(tabs)/(chat)/chat')}
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

const EditCareer = ({ p }: { p: Profile }) => {
  const c = useColors()
  const save = useSaveProfile()
  const [items, setItems] = useState<CareerDraft[]>(p.careers.map(toDraft))
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null)
  const parsed = items.map(toCareer)
  const removeAt = (i: number, item: CareerDraft) => {
    setItems((xs) => xs.filter((_, j) => j !== i))
    setOpen(null)
    showToast({
      message: careerDeleteCopy.toast,
      action: {
        label: careerDeleteCopy.undo,
        onPress: () => {
          setItems((xs) => {
            const next = [...xs]
            next.splice(i, 0, item)
            return next
          })
          setOpen(i)
        },
      },
    })
  }
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
        onSave={() => parsed.every(Boolean) && save.mutate({ careers: parsed as Career[] })}
      />
      <ScrollView
        contentContainerStyle={FORM}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((it, i) => {
          const expanded = open === i
          const valid = parsed[i]
          const start = parseYm(it.start)
          const end = it.current ? null : parseYm(it.end)
          const period = start && (it.current || end) ? careerPeriod({ startedOn: start, endedOn: end }) : null
          return (
            <View key={i} style={{ padding: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2, gap: spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="위로 옮기기"
                  disabled={i === 0}
                  onPress={() => moveUp(i)}
                  hitSlop={spacing[3]}
                >
                  <Icon name="drag-handle" size={18} color="t4" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpen(expanded ? null : i)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[2],
                    minHeight: 24,
                  }}
                  hitSlop={hitSlopTo(24)}
                >
                  <Text v="b1" weight="700" numberOfLines={1} style={{ flex: 1 }}>
                    {it.company || '새 경력'}
                    {it.role ? ` · ${it.role}` : ''}
                  </Text>
                  <Icon name={expanded ? 'up' : 'down'} size={18} color="t3" />
                </Pressable>
              </View>
              {period ? (
                <Text v="c1" color="t3" style={{ paddingLeft: spacing[6] }}>
                  {period}
                </Text>
              ) : null}
              {expanded ? (
                <View style={{ gap: spacing[2], paddingTop: spacing[2] }}>
                  <Input
                    label="회사"
                    value={it.company}
                    invalid={!valid && !it.company.trim()}
                    onChangeText={(t) => set(i, { company: t })}
                  />
                  <Input
                    label="직무"
                    value={it.role}
                    invalid={!valid && !it.role.trim()}
                    onChangeText={(t) => set(i, { role: t })}
                  />
                  <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <DatePicker
                        label="시작"
                        mode="month"
                        surface="bg"
                        value={ymToDate(it.start)}
                        max={new Date()}
                        onChange={(d) => set(i, { start: dateToYm(d) })}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1,
                        minHeight: 48,
                        borderRadius: radius.md,
                        backgroundColor: c.bg,
                        paddingLeft: spacing[4],
                        paddingRight: spacing[2],
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
                    <DatePicker
                      label="종료 (2024.02)"
                      mode="month"
                      surface="bg"
                      value={ymToDate(it.end)}
                      min={ymToDate(it.start) ?? undefined}
                      max={new Date()}
                      onChange={(d) => set(i, { end: dateToYm(d) })}
                    />
                  ) : null}
                  <Input
                    label="한 줄 설명"
                    multiline
                    value={it.description}
                    onChangeText={(t) => set(i, { description: t })}
                  />
                  {valid ? null : (
                    <Text v="c1" weight="600" color="red">
                      {CAREER_MISSING}
                    </Text>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      askConfirm(
                        {
                          title: careerDeleteCopy.title,
                          body: careerDeleteBody(it),
                          confirm: careerDeleteCopy.confirm,
                          danger: true,
                          onConfirm: () => removeAt(i, it),
                        },
                        '/(app)/(stack)/(tabs)/(my)/confirm',
                      )
                    }
                    style={{
                      height: 40,
                      paddingHorizontal: spacing[3],
                      justifyContent: 'center',
                      alignSelf: 'center',
                    }}
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
          size="md"
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

const EditSkills = ({ p }: { p: Profile }) => {
  const c = useColors()
  const save = useSaveProfile()
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
        contentContainerStyle={FORM}
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
              marginTop: -spacing[2],
              borderRadius: radius.card,
              backgroundColor: c.bg2,
              paddingVertical: spacing[1],
              paddingHorizontal: spacing[2],
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
                    gap: spacing[2],
                    height: 44,
                    paddingHorizontal: spacing[3],
                    borderRadius: radius.sm,
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
        <Text v="b2" weight="700" style={{ marginTop: spacing[2] }}>
          내 기술 {skills.length}개
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {skills.map((s, i) => (
            <Chip
              key={s}
              label={s}
              on
              removable
              onPress={() => setSkills((xs) => xs.filter((x) => x !== s))}
              onLongPress={() => moveEarlier(i)}
            />
          ))}
        </View>
        {/* shortcut: long press moves a chip one place earlier (no drag library installed). */}
        <Text v="c1" color="t3">
          {skillOrderHint}
        </Text>
      </ScrollView>
    </>
  )
}

const EditProfileScreen = ({ section }: { section: ProfileSection }) => {
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
      {p ? <Form p={p} /> : <SkeletonRows {...LOADING_ROWS} />}
      {Platform.OS === 'ios' ? <ToastHost /> : null}
    </KeyboardAvoidingView>
  )
}

export default EditProfileScreen

import { router } from 'expo-router'
import { botChatPath } from '@/features/bots'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { initialWindowMetrics, SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Career, CareerStatus, JobCategory, Profile } from '@push/api-client'
import {
  Avatar,
  careerDeleteBody,
  careerDeleteCopy,
  careerPeriod,
  dropIndex,
  indexAfterMove,
  moveItem,
  FieldLabel,
  AVATAR_IMAGE_OPTIONS,
  skillOrderHint,
  parseYm,
  dateToYm,
  ymToDate,
  SheetHeader,
  SKILL_CATALOG,
  skillSuggestions,
  tenureLabel,
  uploadAvatarImage,
  useMyProfile,
  useSaveProfile,
  type ProfileSection,
  CAREER_STATUSES,
  JOB_CATEGORIES,
} from '@/features/my'
import {
  askConfirm,
  Button,
  Chip,
  DatePicker,
  Highlight,
  Icon,
  Menu,
  SegmentedControl,
  showToast,
  SkeletonRows,
  Switch,
  Text,
  TextField,
  ToastHost,
  useKeyboardHeight,
  useToastLive,
  type MenuAction,
} from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { pickImage } from '@/shared/infrastructure'
import { toBoxShadow } from '@/shared/utility'
import { StyleSheet } from 'react-native-unistyles'
import { fontFor, hitSlopTo, radius, spacing, useColors } from '@/theme'

const FIELD_SURFACE = Platform.OS === 'ios' ? 'bg2' : 'bg'
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
  invalid?: boolean
  value: string
  onChangeText: (t: string) => void
  label: string
  placeholder?: string
  multiline?: boolean
  keyboardType?: 'numbers-and-punctuation'
}) => {
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
      style={styles.input(!!multiline, !!invalid)}
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
  return (
    <View style={styles.selectField}>
      <FieldLabel>{label}</FieldLabel>
      <Menu actions={actions} accessibilityLabel={`${label} ${value}`} stretch>
        <View style={styles.selectBox}>
          <Text v="b1">{value}</Text>
          <Icon name="down" size={16} color="t1" />
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
    try {
      const res = await pickImage(AVATAR_IMAGE_OPTIONS)
      const a = res.canceled ? null : res.assets[0]
      if (!a) return
      setPhoto({ uri: a.uri })
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
        <View style={styles.photoRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필 사진 바꾸기"
            accessibilityState={{ busy: uploading }}
            disabled={uploading}
            onPress={() => void pickPhoto()}
          >
            <Avatar name={name || p.displayName} url={photo?.uri ?? p.avatarUrl} size={64} />
            <View style={styles.photoBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color={c.bg} />
              ) : (
                <Icon name="edit" size={13} color={c.bg} />
              )}
            </View>
          </Pressable>
          <Text v="c1" color="t3">
            {'사진은 허브 프로필과\n이력서 템플릿에 함께 쓰여요.'}
          </Text>
        </View>
        <View style={styles.field}>
          <FieldLabel>이름</FieldLabel>
          <TextField accessibilityLabel="이름" value={name} onChangeText={setName} maxLength={20} />
        </View>
        <View style={styles.field}>
          <FieldLabel>헤드라인</FieldLabel>
          <View>
            <TextField
              accessibilityLabel="헤드라인"
              value={headline}
              onChangeText={setHeadline}
              maxLength={40}
              style={styles.headlineInput}
            />
            <View pointerEvents="none" style={styles.counter}>
              <Text v="c2" color="t3">
                {headline.length}/40
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.selectRow}>
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
        <View style={styles.field}>
          <FieldLabel>커리어 상태</FieldLabel>
          <SegmentedControl items={CAREER_STATUSES} value={status} onChange={setStatus} />
        </View>
        <View style={styles.offerRow}>
          <View style={styles.flex}>
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
          style={styles.introInput}
          placeholder="어떤 일을 해 왔고, 요즘 무엇에 관심 있는지 적어 보세요."
        />
        <Button
          label="AI로 다듬기"
          variant="secondary"
          size="md"
          onPress={() => router.push(botChatPath('push'))}
        />
        <Text v="c1" color="t3">
          허브 프로필 맨 위에 보여요. 3~4문장이면 충분해요.
        </Text>
      </ScrollView>
    </>
  )
}

let draftSeq = 0
const draftKey = () => `career-${++draftSeq}`

type CareerDraft = {
  key: string
  company: string
  role: string
  start: string
  end: string
  current: boolean
  description: string
  saved?: { head: string; period: string }
}
const toDraft = (c: Career): CareerDraft => ({
  key: draftKey(),
  company: c.company,
  role: c.role,
  start: c.startedOn.replace('-', '.'),
  end: c.endedOn?.replace('-', '.') ?? '',
  current: !c.endedOn,
  description: c.description,
  saved: { head: `${c.company} · ${c.role}`, period: careerPeriod(c) },
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
  const save = useSaveProfile()
  const [items, setItems] = useState<CareerDraft[]>(p.careers.map(toDraft))
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null)
  const [tried, setTried] = useState(false)
  const [pending, setPending] = useState<{ key: string; toast: number } | null>(null)
  const gone = !useToastLive(pending?.toast ?? null) ? pending?.key : undefined
  const parsed = items.map(toCareer)
  const kept = parsed.filter((_, i) => items[i]!.key !== pending?.key)
  const removeAt = (item: CareerDraft) => {
    const toast = showToast({
      message: careerDeleteCopy.toast,
      action: { label: careerDeleteCopy.undo, onPress: () => setPending(null) },
    })
    setPending({ key: item.key, toast })
    if (pending) setItems((xs) => xs.filter((x) => x.key !== pending.key))
  }
  const set = (i: number, patch: Partial<CareerDraft>) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const [heights, setHeights] = useState<Record<string, number>>({})
  const dragY = useState(() => new Animated.Value(0))[0]
  const dragStyle = { transform: [{ translateY: dragY }, { scale: 1.02 }] }
  const [dragging, setDragging] = useState<number | null>(null)
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return
    setItems((xs) => moveItem(xs, from, to))
    setOpen((o) => indexAfterMove(o, from, to))
  }
  const endDrag = () => {
    dragY.setValue(0)
    setDragging(null)
  }
  const grip = (i: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragY.setValue(0)
        setDragging(i)
      },
      onPanResponderMove: (_, g) => dragY.setValue(g.dy),
      onPanResponderRelease: (_, g) => {
        const room = items.map((x) => (x.key === gone ? -FORM.gap : (heights[x.key] ?? 0)))
        move(i, dropIndex(room, i, g.dy, FORM.gap))
        endDrag()
      },
      onPanResponderTerminate: endDrag,
    }).panHandlers

  return (
    <>
      <SheetHeader
        title={TITLES.career}
        saving={save.isPending}
        onSave={() => (kept.every(Boolean) ? save.mutate({ careers: kept as Career[] }) : setTried(true))}
      />
      <ScrollView
        contentContainerStyle={FORM}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={dragging === null}
      >
        {items.map((it, i) => {
          if (it.key === gone) return null
          const expanded = open === i
          const valid = parsed[i]
          const start = parseYm(it.start)
          const end = it.current ? null : parseYm(it.end)
          const period = it.saved?.period ?? (start && (it.current || end) ? careerPeriod({ startedOn: start, endedOn: end }) : null)
          return (
            <Animated.View
              key={it.key}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height
                setHeights((hs) => (hs[it.key] === h ? hs : { ...hs, [it.key]: h }))
              }}
              style={[styles.card, dragging === i && styles.cardDragging, dragging === i && dragStyle]}
            >
              <View style={styles.cardHead}>
                <View
                  {...grip(i)}
                  accessible
                  accessibilityRole="adjustable"
                  accessibilityLabel="끌어서 순서 바꾸기"
                  accessibilityActions={[
                    { name: 'decrement', label: '위로 옮기기' },
                    { name: 'increment', label: '아래로 옮기기' },
                  ]}
                  onAccessibilityAction={(e) => move(i, e.nativeEvent.actionName === 'decrement' ? i - 1 : i + 1)}
                  hitSlop={spacing[3]}
                >
                  <Icon name="drag-handle" size={18} color="t3" />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpen(expanded ? null : i)}
                  style={styles.cardToggle}
                  hitSlop={hitSlopTo(24)}
                >
                  <Text v="b1" weight="700" numberOfLines={1} style={styles.flex}>
                    {it.saved?.head ?? `${it.company || '새 경력'}${it.role ? ` · ${it.role}` : ''}`}
                  </Text>
                  <Icon name={expanded ? 'up' : 'down'} size={18} color="t3" />
                </Pressable>
              </View>
              {period ? (
                <Text v="c1" color="t3" style={styles.period}>
                  {period}
                </Text>
              ) : null}
              {expanded ? (
                <View style={styles.cardBody}>
                  <Input
                    label="회사"
                    invalid={tried && !it.company.trim()}
                    value={it.company}
                    onChangeText={(t) => set(i, { company: t })}
                  />
                  <Input
                    label="직무"
                    invalid={tried && !it.role.trim()}
                    value={it.role}
                    onChangeText={(t) => set(i, { role: t })}
                  />
                  <View style={styles.dateRow}>
                    <View style={styles.flex}>
                      <DatePicker
                        label="시작"
                        mode="month"
                        surface={FIELD_SURFACE}
                        value={ymToDate(it.start)}
                        max={new Date()}
                        onChange={(d) => set(i, { start: dateToYm(d) })}
                      />
                    </View>
                    <View style={styles.currentBox}>
                      <View style={styles.currentRow}>
                        <Text v="b1">재직 중</Text>
                        <Switch
                          label="재직 중"
                          value={it.current}
                          onValueChange={(v) => set(i, { current: v })}
                        />
                      </View>
                    </View>
                  </View>
                  {!it.current ? (
                    <DatePicker
                      label="종료 (2024.02)"
                      mode="month"
                      surface={FIELD_SURFACE}
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
                  {!valid && tried ? (
                    <Text v="c1" weight="600" color="red">
                      {CAREER_MISSING}
                    </Text>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      askConfirm({
                        title: careerDeleteCopy.title,
                        body: careerDeleteBody(it),
                        confirm: careerDeleteCopy.confirm,
                        danger: true,
                        onConfirm: () => removeAt(it),
                      })
                    }
                    style={styles.deleteButton}
                  >
                    <Text v="b2" weight="600" color="red">
                      이 경력 삭제하기
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </Animated.View>
          )
        })}
        <Button
          label="경력 추가"
          variant="secondary"
          size="md"
          onPress={() => {
            setItems((xs) => [
              ...xs,
              { key: draftKey(), company: '', role: '', start: '', end: '', current: true, description: '' },
            ])
            setOpen(items.length)
          }}
        />
      </ScrollView>
    </>
  )
}

const EditSkills = ({ p }: { p: Profile }) => {
  const save = useSaveProfile()
  const [skills, setSkills] = useState(p.skills)
  const [q, setQ] = useState('')
  const has = (s: string) => skills.some((x) => x.toLowerCase() === s.toLowerCase())
  const hits = q.trim()
    ? skillSuggestions(
        SKILL_CATALOG.filter((s) => !has(s)),
        q,
      )
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
          style={q ? fontFor('600') : undefined}
          onSubmitEditing={() => add(hits[0]?.item ?? q)}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {hits.length ? (
          <View style={styles.hits}>
            {hits.map(({ item }, n) => {
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`${item} 추가`}
                  onPress={() => add(item)}
                  style={styles.hit}
                >
                  <Icon name="plus" size={16} />
                  <Text v="b1" weight={n === 0 ? '700' : undefined}>
                    <Highlight text={item} q={q.trim()} weight={n === 0 ? '700' : '400'} />
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
        <Text v="b2" weight="700" style={styles.skillsTitle}>
          내 기술 {skills.length}개
        </Text>
        <View style={styles.chips}>
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
        <Text v="c1" color="t3">
          {skillOrderHint}
        </Text>
      </ScrollView>
    </>
  )
}

const EditProfileScreen = ({ section }: { section: ProfileSection }) => {
  const raw = useSafeAreaInsets()
  const insets = { ...raw, bottom: Platform.OS === 'ios' ? (initialWindowMetrics?.insets.bottom ?? 0) : raw.bottom }
  const keyboardUp = useKeyboardHeight() > 0
  const { data: p } = useMyProfile()
  const Form =
    { basic: EditBasic, intro: EditIntro, career: EditCareer, skills: EditSkills }[section] ??
    EditBasic
  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen(insets.top, insets.bottom, keyboardUp)}>
        {p ? <Form p={p} /> : <SkeletonRows {...LOADING_ROWS} />}
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' ? (
        <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
          <ToastHost />
        </SafeAreaInsetsContext.Provider>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  input: (multiline: boolean, invalid: boolean) => ({
    ...inputReset,
    minHeight: multiline ? 72 : 48,
    borderRadius: theme.radius.md,
    backgroundColor: Platform.OS === 'ios' ? undefined : theme.colors.bg,
    ...(invalid && Platform.OS !== 'ios' ? { borderWidth: 1.5, borderColor: theme.colors.red } : null),
    paddingHorizontal: theme.spacing[4],
    paddingTop: multiline ? theme.spacing[3] : 0,
    fontSize: (multiline ? theme.type.b2 : theme.type.b1).fontSize,
    lineHeight: (multiline ? theme.type.b2 : theme.type.b1).lineHeight,
    letterSpacing: (multiline ? theme.type.b2 : theme.type.b1).letterSpacing,
    color: theme.colors.t1,
    textAlignVertical: multiline ? 'top' : 'center',
    ...fontFor('400'),
  }),
  selectField: { flex: 1, gap: theme.spacing[2] },
  selectBox: {
    minHeight: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.fill,
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4] },
  photoBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.t1,
    borderWidth: 2,
    borderColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: theme.spacing[2] },
  headlineInput: { paddingRight: 44 },
  counter: { position: 'absolute', right: theme.spacing[4], top: 0, bottom: 0, justifyContent: 'center' },
  selectRow: { flexDirection: 'row', gap: theme.spacing[3] },
  offerRow: {
    minHeight: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.fill,
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  introInput: { minHeight: 200, lineHeight: 25 },
  card: { padding: theme.spacing[4], borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2, gap: theme.spacing[2] },
  cardDragging: {
    zIndex: 1,
    ...(Platform.OS === 'ios' ? theme.shadow.pop : { boxShadow: toBoxShadow(theme.shadow.pop) }),
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  cardToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], minHeight: 24 },
  period: { paddingLeft: theme.spacing[6] },
  cardBody: { gap: theme.spacing[2], paddingTop: theme.spacing[2] },
  dateRow: { flexDirection: 'row', gap: theme.spacing[2], alignItems: 'center' },
  currentBox: { flex: 1, borderRadius: theme.radius.md, backgroundColor: Platform.OS === 'ios' ? undefined : theme.colors.bg },
  currentRow: {
    minHeight: 48,
    paddingLeft: theme.spacing[4],
    paddingRight: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: { height: 40, paddingHorizontal: theme.spacing[3], justifyContent: 'center', alignSelf: 'center' },
  hits: {
    marginTop: -6,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.bg2,
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },
  hit: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 14, borderRadius: theme.radius.sm },
  skillsTitle: { marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
  screen: (top: number, bottom: number, keyboardUp: boolean) => ({
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: Platform.OS === 'android' ? top : 0,
    paddingBottom: Platform.OS === 'android' && keyboardUp ? 0 : bottom,
  }),
}))

export default EditProfileScreen

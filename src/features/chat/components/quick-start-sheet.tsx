import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { Platform, Pressable, TextInput, useWindowDimensions, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { fontFor, hitSlopTo, selectedRing, spacing, useColors } from '@/theme'
import { Badge, Button, Chip, Icon, RecentList, SegmentedControl, Sheet, SHEET_ACTION_GAP, SheetScroll, Switch, Text, TextField, useSheetScrollMax } from '@/shared/components'
import { inputMetrics } from '@/shared/components/text-field-metrics'
import { readClipboard } from '@/shared/infrastructure'
import { displayName } from '@/shared/utility/display-name'
import { type QsItem } from '../api/schemas'
import { useChatDocs, useHubProfileId, useQuickStart, useStartChat } from '../api/hooks'
import Mark from './mark'
import PageModal from './page-modal'
import Pick from './pick'
import { ALL_DESCRIPTION_TOP, ALL_FIELD_HEIGHT, CALENDAR_TASKS, DEFAULT_DOC, type QuickStart } from '../constants'
import { initialPicks, startLink } from '../utils/quick-start-data'
import { quickStartAllPath } from '../utils/sheet-routes'


const QuickStartSheet = ({ qs, onClose, all }: { qs: QuickStart | null; onClose: () => void; all?: boolean }) => {
  return qs ? <Body key={qs.key} qs={qs} onClose={onClose} all={all} /> : null
}

const Body = ({ qs, onClose, all }: { qs: QuickStart; onClose: () => void; all?: boolean }) => {
  const bound = useSheetScrollMax()
  const start = useStartChat()
  const q = useQuickStart(qs.key)
  const docs = useChatDocs(!!qs.docLabel)
  const d = q.data
  const [seg, setSeg] = useState(0)
  const [sel, setSel] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const clip = useCopiedLink(qs.layout === 'link')
  const [chips, setChips] = useState<string[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [option, setOption] = useState(true)
  const [doc, setDoc] = useState<string>()
  const [pickingDoc, setPickingDoc] = useState(!!all)
  const [pickingJob, setPickingJob] = useState(false)
  const [task, setTask] = useState(0)
  const [custom, setCustom] = useState('')

  const [seen, setSeen] = useState(d)
  if (d && d !== seen) {
    setSeen(d)
    setSel(initialPicks(qs, d.items))
    setChips(d.chips ?? [])
    setDoc(d.doc && !qs.docLabel ? DEFAULT_DOC : d.doc)
  }

  const visible = d?.items.filter((i) => (i.seg ?? 0) === seg) ?? []
  const picked = qs.layout === 'calendar' ? (d?.items ?? []) : (d?.items ?? []).filter((i, k, all) => sel.includes(i.id) && all.findIndex((x) => x.id === i.id) === k)
  const hubId = useHubProfileId(!!qs.docLabel || !!qs.readsHub)
  const docList = [{ id: 'hub-profile', fileName: DEFAULT_DOC }, ...(docs.data ?? [])]
  const documentId = doc === DEFAULT_DOC ? hubId.data : docs.data?.find((x) => x.fileName === doc)?.id
  const input = { picked, url: startLink(url, clip), chips, option, doc: doc && displayName(doc), documentId, task: CALENDAR_TASKS[task]!, custom }

  const go = (override?: QsItem) => {
    const r = qs.start(override ? { ...input, picked: [override] } : input)
    if (!r) return
    onClose()
    void start(r.title, r.message, undefined, undefined, r.intent, r.context)
  }

  const toggle = (id: string) =>
    setSel((cur) => (qs.multi ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]))

  const actionLabel = typeof qs.action === 'function' ? qs.action(qs.layout === 'calendar' ? task : picked.length) : qs.action
  const action = actionLabel ? { label: actionLabel, onPress: () => go(), disabled: !d || !qs.start(input) } : undefined
  const job = qs.listLabel ? picked[0] : undefined
  const listOpen = all || !job || pickingJob || !!qs.openList
  const seeAll = all ? undefined : () => router.replace(quickStartAllPath(qs.key))
  const docField = qs.docLabel ? (
    <DocField label={qs.docLabel} doc={doc} picking={pickingDoc} docs={docList} onToggle={() => setPickingDoc((v) => !v)} onPick={(name) => (setDoc(name), setPickingDoc(false))} onSeeAll={seeAll} />
  ) : null
  const typing = custom.trim() !== ''
  const content = !d ? (
    <Text v="b2" color="t3" style={styles.loading}>
      {q.isError ? '불러오지 못했어요. 닫았다가 다시 열어 주세요.' : '불러오는 중이에요'}
    </Text>
  ) : (
    <>
      {all && qs.description ? (
        <Text v="b2" color="t3" style={styles.allDescription}>
          {qs.description}
        </Text>
      ) : null}

      {qs.layout === 'link' ? <LinkInput url={url} setUrl={setUrl} clip={clip} /> : null}

      {qs.layout === 'match' ? (
        <>
          <View style={styles.wrap}>
            {chips.map((ch) => (
              <Chip key={ch} label={ch} on removable onPress={() => setChips((cur) => cur.filter((x) => x !== ch))} />
            ))}
            <AddChip onPress={() => setAdding('')} />
          </View>
          {adding !== null ? (
            <TextField
              placeholder="예: 판교, Kafka"
              value={adding}
              onChangeText={setAdding}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (adding.trim()) setChips((cur) => [...cur, adding.trim()])
                setAdding(null)
              }}
            />
          ) : null}
          <View style={styles.panel}>
            <Text v="b2" style={styles.flex}>
              적합도 7점 이상인 공고만 보여 드려요
            </Text>
            <Switch value={option} onValueChange={setOption} label="적합도 7점 이상인 공고만" />
          </View>
        </>
      ) : null}

      {qs.listLabel && (docField || (job && !all && !qs.openList)) ? (
        <View style={styles.pickers}>
          {docField}
          {job && !all && !qs.openList ? <PickerRow label={qs.listLabel} value={[job.over, job.title].filter(Boolean).join(' · ')} onPress={() => setPickingJob((v) => !v)} /> : null}
        </View>
      ) : null}

      {d.segments && (!qs.listLabel || listOpen) ? (
        <SegmentedControl items={d.segments.map((label, i) => ({ key: String(i), label }))} value={String(seg)} onChange={(k) => setSeg(Number(k))} slim={!all} />
      ) : null}

      {qs.layout === 'calendar' ? <Calendar items={d.items} task={task} setTask={setTask} /> : null}

      {qs.layout === 'cards' ? (
        <View style={qs.grid ? styles.wrap : all ? styles.cardsAll : styles.cards}>
          {qs.grid ? (
            visible.map((it) => <OptionCard key={it.id} item={it} on={!typing && sel.includes(it.id)} grid onPress={() => (setCustom(''), toggle(it.id))} />)
          ) : (
            <RecentList
              items={visible}
              keyOf={(it) => it.id}
              gap={all ? spacing[2] : spacing[3]}
              moreGap={spacing[3]}
              renderItem={(it) => <OptionCard item={it} flat={all} on={!typing && sel.includes(it.id)} onPress={() => (setCustom(''), toggle(it.id))} />}
              onSeeAll={seeAll}
            />
          )}
          {qs.custom ? <TextField placeholder={qs.custom} accessibilityLabel={qs.custom} value={custom} onChangeText={setCustom} minHeight={all ? ALL_FIELD_HEIGHT : qs.customHeight} /> : null}
        </View>
      ) : null}

      {['pick', 'status', 'reply'].includes(qs.layout) && listOpen ? (
        <View>
          {!visible.length && d.empty?.[seg] ? (
            <Text v="b2" color="t3" style={styles.empty}>
              {d.empty[seg]}
            </Text>
          ) : null}
          <RecentList
            items={visible}
            keyOf={(it) => it.id}
            moreGap={qs.layout === 'reply' ? 0 : spacing[3]}
            onSeeAll={seeAll}
            renderItem={(it) => (
              <ItemRow item={it} layout={qs.layout} on={sel.includes(it.id)} onPress={qs.layout === 'reply' ? () => go(it) : () => (toggle(it.id), setPickingJob(false))} />
            )}
          />
        </View>
      ) : null}
    </>
  )
  if (all)
    return (
      <PageModal title={qs.title} sheet white onClose={onClose} footer={action ? <Button label={action.label} disabled={action.disabled} onPress={action.onPress} /> : undefined}>
        <View style={styles.page}>{content}</View>
      </PageModal>
    )
  return (
    <Sheet gap={spacing[3]} actionGap={SHEET_ACTION_GAP.quickStart} action={action} onLayout={bound.onSheetLayout}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text v="h2" accessibilityRole="header">
            {qs.title}
          </Text>
          {qs.description ? (
            <Text v="b2" color="t3">
              {qs.description}
            </Text>
          ) : null}
        </View>
      </View>
      <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {content}
      </SheetScroll>
    </Sheet>
  )
}

const useCopiedLink = (on: boolean) => {
  const [clip, setClip] = useState('')
  useEffect(() => {
    if (on) void readClipboard().then((text) => setClip(/^https?:\/\/\S+$/.test(text.trim()) ? text.trim() : ''))
  }, [on])
  return clip
}

const LinkInput = ({ url, setUrl, clip }: { url: string; setUrl: (v: string) => void; clip: string }) => (
  <>
    <LinkField value={url} onChangeText={setUrl} />
    {clip && url !== clip ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="붙여넣기"
        onPress={() => setUrl(clip)}
        style={styles.paste}
      >
        <Icon name="copy" size={18} color="t1" />
        <View style={styles.grow}>
          <Text v="c2" weight="700" color="t1">
            복사한 링크
          </Text>
          <Text v="b2" numberOfLines={1}>
            {clip.replace(/^https?:\/\//, '')}
          </Text>
        </View>
        <Text v="b2" weight="700" color="t1">
          붙여넣기
        </Text>
      </Pressable>
    ) : null}
  </>
)

const LinkField = ({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) => {
  const c = useColors()
  const { fontScale } = useWindowDimensions()
  return (
    <View style={styles.linkField}>
      <Icon name="link" size={18} color="t1" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="https://"
        placeholderTextColor={c.t4}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        autoFocus
        accessibilityLabel="공고 링크"
        style={[styles.linkInput(fontScale), fontFor('400')]}
      />
    </View>
  )
}

const AddChip = ({ onPress }: { onPress: () => void }) => {
  const c = useColors()
  const fg = Platform.OS === 'ios' ? c.t1 : c.t2
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={hitSlopTo(34)}
      style={styles.addChip}
    >
      <Icon name="plus" size={14} color={fg} />
      <Text v="c1" weight="600" style={styles.addLabel}>
        조건 추가
      </Text>
    </Pressable>
  )
}

const PickerRow = ({ label, value, onPress }: { label: string; value: string; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label} ${value}`}
    onPress={onPress}
    style={styles.panel}
  >
    <View style={styles.grow}>
      <Text v="c2" weight="600" color="t3">
        {label}
      </Text>
      <Text v="b2" weight="700" numberOfLines={1}>
        {value}
      </Text>
    </View>
    <Icon name="chev" size={18} color="t3" />
  </Pressable>
)

const DocField = ({
  label,
  doc,
  picking,
  docs,
  onToggle,
  onPick,
  onSeeAll,
}: {
  label: string
  doc?: string
  picking: boolean
  docs: { id: string; fileName: string }[]
  onToggle: () => void
  onPick: (name: string) => void
  onSeeAll?: () => void
}) =>
  doc ? (
    <>
      <PickerRow label={label} value={displayName(doc)} onPress={onToggle} />
      {picking ? (
        <RecentList
          items={docs}
          keyOf={(x) => x.id}
          onSeeAll={onSeeAll}
          renderItem={(x) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: x.fileName === doc }}
              onPress={() => onPick(x.fileName)}
              style={styles.docRow}
            >
              <Pick on={x.fileName === doc} />
              <Text v="b2" numberOfLines={1} style={styles.flex}>
                {displayName(x.fileName)}
              </Text>
            </Pressable>
          )}
        />
      ) : null}
    </>
  ) : null

const ItemRow = ({ item, layout, on, onPress }: { item: QsItem; layout: string; on: boolean; onPress?: () => void }) => {
  const status = layout === 'status'
  const content = (
    <View style={[styles.itemRow(status ? 56 : layout === 'pick' && item.logo ? 60 : 58), !!item.body && styles.itemRowBody]}>
      {status ? <Pick on={on} square /> : null}
      {item.logo ? <Mark text={item.logo.text} color={item.logo.color} size={status ? 40 : 44} /> : null}
      {item.avatar ? <Mark text={item.avatar.text} color={item.avatar.color} round /> : null}
      <View style={[styles.grow, !!item.body && styles.itemTextBody]}>
        {item.over ? (
          <Text v="c1" weight="600" color="t3">
            {item.over}
          </Text>
        ) : null}
        <View style={styles.titleRow}>
          <Text v="b1" weight="700" numberOfLines={1} style={styles.shrink}>
            {item.title}
          </Text>
          {layout === 'reply' && item.badge ? <Badge {...item.badge} /> : null}
          {layout === 'reply' && item.meta ? (
            <Text v="c2" color="t3" style={styles.meta}>
              {item.meta}
            </Text>
          ) : null}
        </View>
        {item.sub ? (
          <Text v={layout === 'pick' && item.logo ? 'c2' : 'c1'} color="t3" numberOfLines={1}>
            {item.sub}
          </Text>
        ) : null}
        {item.body ? (
          <Text v="b2" color="t2" numberOfLines={1}>
            {item.body}
          </Text>
        ) : null}
      </View>
      {status && item.badge ? <Badge {...item.badge} /> : null}
      {layout === 'pick' ? <Pick on={on} /> : null}
    </View>
  )
  if (!onPress) return content
  return (
    <Pressable
      accessibilityRole={layout === 'reply' ? 'button' : status ? 'checkbox' : 'radio'}
      accessibilityState={layout === 'reply' ? undefined : status ? { checked: on } : { selected: on }}
      onPress={onPress}
    >
      {content}
    </Pressable>
  )
}

const OptionCard = ({ item, on, grid, flat, onPress }: { item: QsItem; on: boolean; grid?: boolean; flat?: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={[styles.option, grid && styles.optionGrid, on ? styles.optionOn : styles.ringOff]}>
    <Pick on={on} square />
    <View style={[styles.optionText, !(item.meta || flat) && styles.optionTextPad]}>
      <Text v="b1" weight="700">
        {item.title}
      </Text>
      {item.sub ? (
        <Text v="c1" color="t2">
          {item.sub}
        </Text>
      ) : null}
      {item.meta ? (
        <Text v="c2" color="t3">
          {item.meta}
        </Text>
      ) : null}
    </View>
  </Pressable>
)

const Calendar = ({ items, task, setTask }: { items: QsItem[]; task: number; setTask: (n: number) => void }) => (
  <>
    <View style={styles.calendar}>
      <Text v="c1" weight="700" color="t3" style={styles.week}>
        이번 주 {items.length}건
      </Text>
      {items.map((e) => (
        <View key={e.id} style={styles.event}>
          <View style={styles.day}>
            <Text v="c2" weight="600" color="t3">
              {e.date?.dow}
            </Text>
            <Text v="b1" weight="400">
              {e.date?.day}
            </Text>
          </View>
          <View style={styles.stripe(e.date?.color ?? 'green')} />
          <View style={styles.grow}>
            <Text v="b2" weight="700" numberOfLines={1}>
              {e.title}
            </Text>
            <Text v="c2" color="t3">
              {e.sub}
            </Text>
          </View>
          {e.badge ? <Badge {...e.badge} /> : null}
        </View>
      ))}
    </View>
    <View style={styles.wrap}>
      {CALENDAR_TASKS.map((label, i) => {
        const on = i === task
        return (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => setTask(i)}
            style={[styles.task, on ? styles.ringOn : styles.ringOff]}
          >
            <Text v="b1" weight="600">
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  </>
)

const styles = StyleSheet.create((theme) => ({
  loading: { paddingVertical: theme.spacing[6], textAlign: 'center' },
  allDescription: { marginTop: ALL_DESCRIPTION_TOP },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
  panel: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[3], paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2 },
  flex: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  pickers: { gap: theme.spacing[2] },
  cards: { gap: theme.spacing[3] },
  cardsAll: { gap: theme.spacing[4] },
  empty: { paddingVertical: theme.spacing[4], textAlign: 'center' },
  page: { gap: theme.spacing[4], paddingHorizontal: theme.spacing[5] },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[2] },
  headText: { flex: 1, gap: theme.spacing[1] },
  scroll: (maxHeight: number | undefined) => ({ maxHeight }),
  scrollContent: { gap: theme.spacing[3] },
  paste: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[3], paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.md, backgroundColor: theme.colors.acSoft },
  linkField: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], minHeight: 54, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.md, backgroundColor: theme.colors.fill },
  linkInput: (fontScale: number) => ({ flex: 1, fontSize: theme.type.b1.fontSize, letterSpacing: theme.type.b1.letterSpacing, color: theme.colors.t1, ...inputMetrics(false, fontScale) }),
  addChip: { minHeight: 34, borderRadius: theme.radius.chip, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: theme.spacing[1], backgroundColor: theme.colors.fill },
  addLabel: { fontSize: 14, color: Platform.OS === 'ios' ? theme.colors.t1 : theme.colors.t2 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], minHeight: 48, paddingHorizontal: theme.spacing[1] },
  itemRow: (minHeight: number) => ({ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], minHeight, paddingVertical: 0 }),
  itemRowBody: { alignItems: 'flex-start', paddingVertical: theme.spacing[3] },
  itemTextBody: { gap: theme.spacing[1] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  meta: { marginLeft: 'auto' },
  option: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3], padding: theme.spacing[4] - selectedRing(theme.colors).borderWidth, borderRadius: theme.radius.card },
  optionGrid: { flexGrow: 1, flexBasis: '48%' },
  optionOn: { borderRadius: theme.radius.md, ...selectedRing(theme.colors) },
  ringOn: selectedRing(theme.colors),
  ringOff: { backgroundColor: theme.colors.bg2, borderWidth: selectedRing(theme.colors).borderWidth, borderColor: 'transparent' },
  optionText: { flex: 1, gap: theme.spacing[1] },
  optionTextPad: { paddingBottom: theme.spacing[1] },
  calendar: { paddingVertical: theme.spacing[1], paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2 },
  week: { paddingTop: theme.spacing[2] },
  event: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], minHeight: 52 },
  day: { width: 40, alignItems: 'center' },
  stripe: (color: 'red' | 'orange' | 'green') => ({ width: 3, alignSelf: 'stretch', marginVertical: theme.spacing[2], borderRadius: 2, backgroundColor: theme.colors[color] }),
  task: { height: 48, paddingHorizontal: theme.spacing[5] - selectedRing(theme.colors).borderWidth, justifyContent: 'center', borderRadius: theme.radius.pill },
}))

export default QuickStartSheet

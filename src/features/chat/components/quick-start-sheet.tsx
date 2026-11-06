import { router } from 'expo-router'
import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { hitSlopTo, radius, selectedRing, spacing, useColors } from '@/theme'
import { Badge, Chip, GlassButton, Icon, SegmentedControl, Sheet, SheetScroll, Switch, Text, TextField, useSheetScrollMax } from '@/shared/components'
import { readClipboard } from '@/shared/infrastructure'
import { type QsItem } from '../api/schemas'
import { useChatDocs, useQuickStart, useStartChat } from '../api/hooks'
import Mark from './mark'
import Pick from './pick'
import { CALENDAR_TASKS, type QuickStart } from '../constants'
import { initialPicks } from '../utils/quick-start-data'


/** Ingredient sheet for one quick start (Qs*.html). Collects what the task needs, then starts the conversation. */
export const QuickStartSheet = ({ qs, onClose }: { qs: QuickStart | null; onClose: () => void }) => {
  return qs ? <Body key={qs.key} qs={qs} onClose={onClose} /> : null
}

const Body = ({ qs, onClose }: { qs: QuickStart; onClose: () => void }) => {
  const c = useColors()
  const bound = useSheetScrollMax(0.55)
  const start = useStartChat()
  const q = useQuickStart(qs.key)
  const docs = useChatDocs(!!qs.docLabel)
  const d = q.data
  const [seg, setSeg] = useState(0)
  const [sel, setSel] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const [chips, setChips] = useState<string[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [option, setOption] = useState(true)
  const [doc, setDoc] = useState<string>()
  const [pickingDoc, setPickingDoc] = useState(false)
  const [pickingJob, setPickingJob] = useState(false)
  const [task, setTask] = useState(0)
  const [custom, setCustom] = useState<string | null>(null)

  // Reset the picks when new quick-start data arrives (adjusting state during render, not in an effect).
  const [seen, setSeen] = useState(d)
  if (d && d !== seen) {
    setSeen(d)
    setSel(initialPicks(qs, d.items))
    setChips(d.chips ?? [])
    setDoc(d.doc)
  }

  const visible = d?.items.filter((i) => (i.seg ?? 0) === seg) ?? []
  // 지원 현황 lists an active application under both tabs; pick it once.
  const picked = qs.layout === 'deadline' || qs.layout === 'calendar' ? (d?.items ?? []) : (d?.items ?? []).filter((i, k, all) => sel.includes(i.id) && all.findIndex((x) => x.id === i.id) === k)
  const documentId = docs.data?.find((x) => x.fileName === doc)?.id
  const input = { picked, url, chips, option, doc, documentId, task: CALENDAR_TASKS[task]!.label, custom: custom ?? '' }

  const go = (override?: QsItem) => {
    const r = qs.start(override ? { ...input, picked: [override] } : input)
    if (!r) return
    onClose()
    void start(r.title, r.message, undefined, undefined, r.intent, r.context)
  }

  const toggle = (id: string) =>
    setSel((cur) => (qs.multi ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]))

  const actionLabel = typeof qs.action === 'function' ? qs.action(qs.layout === 'calendar' ? task : picked.length) : qs.action
  const title = qs.layout === 'deadline' && d ? `${qs.title} ${d.items.length}개` : qs.title

  const action = actionLabel ? { label: actionLabel, onPress: () => go(), disabled: !d || !qs.start(input) } : undefined
  const job = qs.listLabel ? picked[0] : undefined
  const listOpen = !job || pickingJob
  const docField = (
    <DocField label={qs.docLabel} doc={doc} picking={pickingDoc} chevron={!!qs.listLabel} docs={docs.data} onToggle={() => setPickingDoc((v) => !v)} onPick={(name) => (setDoc(name), setPickingDoc(false))} />
  )
  return (
    <Sheet gap={spacing[3]} action={action} onLayout={bound.onSheetLayout}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] }}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Text v="h2" accessibilityRole="header">
            {title}
          </Text>
          <Text v="b2" color="t3">
            {qs.description}
          </Text>
        </View>
        <View style={{ margin: -spacing[1] }}>
          <GlassButton filled actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />
        </View>
      </View>
      <SheetScroll style={{ maxHeight: bound.maxHeight }} onLayout={bound.onScrollLayout} contentContainerStyle={{ gap: spacing[3] }} keyboardShouldPersistTaps="handled">
        {!d ? (
          <Text v="b2" color="t3" style={{ paddingVertical: spacing[6], textAlign: 'center' }}>
            {q.isError ? '불러오지 못했어요. 닫았다가 다시 열어 주세요.' : '불러오는 중이에요'}
          </Text>
        ) : (
          <>
            {qs.layout === 'link' ? <LinkInput url={url} setUrl={setUrl} /> : null}

            {qs.layout === 'match' ? (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                  {chips.map((ch) => (
                    <Chip key={ch} label={ch} on removable onPress={() => setChips((cur) => cur.filter((x) => x !== ch))} />
                  ))}
                  <Chip label="조건 추가" icon="plus" onPress={() => setAdding('')} />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}>
                  <Icon name="spark" size={18} color="acText" filled />
                  <Text v="b2" style={{ flex: 1 }}>
                    적합도 7점 이상인 공고만 보여 드려요
                  </Text>
                  <Switch value={option} onValueChange={setOption} label="적합도 7점 이상인 공고만" />
                </View>
              </>
            ) : null}

            {d.segments ? (
              <SegmentedControl
                items={d.segments.map((label, i) => ({ key: String(i), label }))}
                value={String(seg)}
                onChange={(k) => setSeg(Number(k))}
              />
            ) : null}

            {qs.layout === 'calendar' ? (
              <Calendar
                items={d.items}
                connected={!!d.calendar?.connected}
                task={task}
                setTask={setTask}
                onChange={() => router.push({ pathname: '/my', params: { tab: 'activity', sub: 'calendar' } })}
              />
            ) : null}

            {qs.layout === 'cards' ? (
              <View style={qs.grid ? { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] } : { gap: spacing[3] }}>
                {visible.map((it) => (
                  <OptionCard key={it.id} item={it} on={custom === null && sel.includes(it.id)} grid={qs.grid} onPress={() => (setCustom(null), toggle(it.id))} />
                ))}
                {qs.custom ? (
                  custom === null ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setCustom('')}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}
                    >
                      <Icon name="plus" size={20} color="t3" />
                      <Text v="b1" weight="600">
                        {qs.custom}
                      </Text>
                    </Pressable>
                  ) : (
                    <TextField placeholder={qs.custom} value={custom} onChangeText={setCustom} autoFocus />
                  )
                ) : null}
              </View>
            ) : null}

            {qs.listLabel ? (
              <>
                <View style={{ gap: spacing[2] }}>
                  {docField}
                  {job ? (
                    <PickerRow
                      label={qs.listLabel}
                      value={[job.over, job.title].filter(Boolean).join(' · ')}
                      lead={job.logo ? <Mark text={job.logo.text} color={job.logo.color} size={34} /> : undefined}
                      onPress={() => setPickingJob((v) => !v)}
                    />
                  ) : null}
                </View>
              </>
            ) : null}

            {['pick', 'deadline', 'status', 'reply'].includes(qs.layout) && listOpen ? (
              <View>
                {!visible.length && d.empty?.[seg] ? (
                  <Text v="b2" color="t3" style={{ paddingVertical: spacing[4], textAlign: 'center' }}>
                    {d.empty[seg]}
                  </Text>
                ) : null}
                {visible.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    layout={qs.layout}
                    on={sel.includes(it.id)}
                    onPress={qs.layout === 'reply' ? () => go(it) : qs.layout === 'deadline' ? undefined : () => (toggle(it.id), setPickingJob(false))}
                  />
                ))}
              </View>
            ) : null}

            {qs.listLabel ? null : docField}
          </>
        )}
      </SheetScroll>
    </Sheet>
  )
}

const LinkInput = ({ url, setUrl }: { url: string; setUrl: (v: string) => void }) => {
  const c = useColors()
  const [clip, setClip] = useState('')
  useEffect(() => {
    void readClipboard().then((text) => setClip(/^https?:\/\/\S+$/.test(text.trim()) ? text.trim() : ''))
  }, [])
  return (
    <>
      <TextField icon="link" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" autoFocus accessibilityLabel="공고 링크" />
      {clip && url !== clip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="붙여넣기"
          onPress={() => setUrl(clip)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: radius.md, backgroundColor: c.acSoft }}
        >
          <Icon name="link" size={20} color="acText" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text v="c2" weight="700" color="acText">
              복사한 링크
            </Text>
            <Text v="b2" numberOfLines={1}>
              {clip}
            </Text>
          </View>
          <Text v="b2" weight="700" color="acText">
            붙여넣기
          </Text>
        </Pressable>
      ) : null}
    </>
  )
}

const PickerRow = ({ label, value, lead, trailing, onPress }: { label: string; value: string; lead?: ReactNode; trailing?: ReactNode; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${value}, 변경`}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}
    >
      {lead}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="c2" weight="600" color="t3">
          {label}
        </Text>
        <Text v="b2" weight="700" numberOfLines={1}>
          {value}
        </Text>
      </View>
      {trailing ?? <Icon name="chev" size={18} color="t3" />}
    </Pressable>
  )
}

const DocField = ({
  label,
  doc,
  picking,
  chevron,
  docs,
  onToggle,
  onPick,
}: {
  label?: string
  doc?: string
  picking: boolean
  chevron: boolean
  docs?: { id: string; fileName: string }[]
  onToggle: () => void
  onPick: (name: string) => void
}) =>
  label && doc ? (
    <>
      <PickerRow
        label={label}
        value={doc}
        onPress={onToggle}
        trailing={
          chevron ? undefined : (
            <Text v="c1" weight="700" color="acText">
              변경
            </Text>
          )
        }
      />
      {picking
        ? docs?.map((x) => (
            <Pressable
              key={x.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: x.fileName === doc }}
              onPress={() => onPick(x.fileName)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 48, paddingHorizontal: spacing[1] }}
            >
              <Pick on={x.fileName === doc} />
              <Text v="b2" numberOfLines={1} style={{ flex: 1 }}>
                {x.fileName}
              </Text>
            </Pressable>
          ))
        : null}
    </>
  ) : null

const ItemRow = ({ item, layout, on, onPress }: { item: QsItem; layout: string; on: boolean; onPress?: () => void }) => {
  const status = layout === 'status'
  const content = (
    <View style={{ flexDirection: 'row', alignItems: item.body ? 'flex-start' : 'center', gap: spacing[3], minHeight: status ? 56 : layout === 'pick' && item.logo ? 60 : 58, paddingVertical: item.body ? spacing[3] : 0 }}>
      {status ? <Pick on={on} square /> : null}
      {item.logo ? <Mark text={item.logo.text} color={item.logo.color} size={status ? 40 : 44} /> : null}
      {item.avatar ? <Mark text={item.avatar.text} color={item.avatar.color} round /> : null}
      <View style={{ flex: 1, minWidth: 0, gap: item.body ? spacing[1] : 0 }}>
        {item.over ? (
          <Text v="c1" weight="600" color="t3">
            {item.over}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
            {item.title}
          </Text>
          {layout === 'reply' && item.badge ? <Badge {...item.badge} /> : null}
          {layout === 'reply' && item.meta ? (
            <Text v="c2" color="t3" style={{ marginLeft: 'auto' }}>
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
      {layout === 'deadline' ? (
        <View style={{ alignItems: 'flex-end', gap: spacing[1] }}>
          {item.badge ? <Badge {...item.badge} /> : null}
          {item.note ? (
            <Text v="c2" weight="600" color={item.note.ac ? 'acText' : 't3'}>
              {item.note.label}
            </Text>
          ) : null}
        </View>
      ) : null}
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

const OptionCard = ({ item, on, grid, onPress }: { item: QsItem; on: boolean; grid?: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        padding: spacing[4],
        borderRadius: on ? radius.md : radius.card,
        width: grid ? '48.5%' : undefined,
        ...(on ? selectedRing(c) : { backgroundColor: c.bg2, borderWidth: selectedRing(c).borderWidth, borderColor: 'transparent' }),
      }}
    >
      <Pick on={on} square />
      <View style={{ flex: 1, gap: spacing[1] }}>
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
}

const Calendar = ({ items, connected, task, setTask, onChange }: { items: QsItem[]; connected: boolean; task: number; setTask: (n: number) => void; onChange: () => void }) => {
  const c = useColors()
  return (
    <>
      <View style={{ paddingVertical: spacing[1], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}>
        <Text v="c1" weight="700" color="t3" style={{ paddingTop: spacing[2] }}>
          이번 주 {items.length}건
        </Text>
        {items.map((e) => (
          <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 52 }}>
            <View style={{ width: 40, alignItems: 'center' }}>
              <Text v="c2" weight="600" color="t3">
                {e.date?.dow}
              </Text>
              <Text v="b1">
                {e.date?.day}
              </Text>
            </View>
            <View style={{ width: 3, alignSelf: 'stretch', marginVertical: spacing[2], borderRadius: 2, backgroundColor: c[e.date?.color ?? 'green'] }} />
            <View style={{ flex: 1, minWidth: 0 }}>
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
        {CALENDAR_TASKS.map((t, i) => {
          const on = i === task
          return (
            <Pressable
              key={t.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setTask(i)}
              style={{ width: '48.5%', gap: spacing[2], padding: spacing[4], borderRadius: radius.md, ...(on ? selectedRing(c) : { backgroundColor: c.bg2, borderWidth: selectedRing(c).borderWidth, borderColor: 'transparent' }) }}
            >
              <Icon name={t.icon} size={20} color={on ? 'acText' : 't2'} />
              <Text v="b2" weight="700">
                {t.label}
              </Text>
              <Text v="c2" color="t3">
                {t.sub}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: connected ? c.green : c.t4 }} />
        <Text v="b2" style={{ flex: 1 }}>
          {connected ? 'Google 캘린더와 연결됨' : 'Google 캘린더와 연결 안 됨'}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="캘린더 변경" onPress={onChange} hitSlop={hitSlopTo(18)}>
          <Text v="c1" weight="700" color="acText">
            변경
          </Text>
        </Pressable>
      </View>
    </>
  )
}

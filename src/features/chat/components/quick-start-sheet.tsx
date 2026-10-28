import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useColors } from '../../../theme'
import { Badge, BottomSheet, Chip, Icon, SegmentedControl, Switch, Text, TextField } from '@/shared/components'
import { type QsItem } from '../api/schemas'
import { FileTag } from './items'
import { useChatDocs, useQuickStart, useStartChat } from '../api/hooks'
import Mark from './mark'
import Pick from './pick'
import { CALENDAR_TASKS, type QuickStart } from '../constants'

/** Ingredient sheet for one quick start (Qs*.html). Collects what the task needs, then starts the conversation. */
export const QuickStartSheet = ({ qs, onClose }: { qs: QuickStart | null; onClose: () => void }) => {
  return qs ? <Sheet key={qs.key} qs={qs} onClose={onClose} /> : null
}

const Sheet = ({ qs, onClose }: { qs: QuickStart; onClose: () => void }) => {
  const c = useColors()
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
  const [task, setTask] = useState(0)
  const [custom, setCustom] = useState<string | null>(null)

  // Reset the picks when new quick-start data arrives (adjusting state during render, not in an effect).
  const [seen, setSeen] = useState(d)
  if (d && d !== seen) {
    setSeen(d)
    setSel(d.items.filter((i) => i.selected).map((i) => i.id))
    setChips(d.chips ?? [])
    setDoc(d.doc)
  }

  const visible = d?.items.filter((i) => (i.seg ?? 0) === seg) ?? []
  const picked = qs.layout === 'deadline' || qs.layout === 'calendar' ? (d?.items ?? []) : (d?.items ?? []).filter((i) => sel.includes(i.id))
  const input = { picked, url, chips, option, doc, task: CALENDAR_TASKS[task]!.label, custom: custom ?? '' }

  const go = (override?: QsItem) => {
    const r = qs.start(override ? { ...input, picked: [override] } : input)
    if (!r) return
    onClose()
    void start(r.title, r.message)
  }

  const toggle = (id: string) =>
    setSel((cur) => (qs.multi ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]))

  const actionLabel = typeof qs.action === 'function' ? qs.action(qs.layout === 'calendar' ? task : picked.length) : qs.action
  const title = qs.layout === 'deadline' && d ? `${qs.title} ${d.items.length}개` : qs.title

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={title}
      description={qs.description}
      action={actionLabel ? { label: actionLabel, onPress: () => go(), disabled: !d || !qs.start(input) } : undefined}
    >
      {!d ? (
        <Text v="b2" color="t3" style={{ paddingVertical: 24, textAlign: 'center' }}>
          {q.isError ? '불러오지 못했어요. 닫았다가 다시 열어 주세요.' : '불러오는 중이에요'}
        </Text>
      ) : (
        <>
          {qs.layout === 'link' ? (
            <TextField icon="link" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" autoFocus accessibilityLabel="공고 링크" />
          ) : null}

          {qs.layout === 'match' ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {chips.map((ch) => (
                  <Chip key={ch} label={ch} on removable onPress={() => setChips((cur) => cur.filter((x) => x !== ch))} />
                ))}
                <Chip label="+ 조건 추가" onPress={() => setAdding('')} />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.bg2 }}>
                <Icon name="filter" size={20} color="acText" />
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

          {qs.layout === 'calendar' ? <Calendar items={d.items} connected={!!d.calendar?.connected} task={task} setTask={setTask} /> : null}

          {qs.layout === 'cards' ? (
            <View style={qs.grid ? { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } : { gap: 8 }}>
              {visible.map((it) => (
                <OptionCard key={it.id} item={it} on={custom === null && sel.includes(it.id)} grid={qs.grid} onPress={() => (setCustom(null), toggle(it.id))} />
              ))}
              {qs.custom ? (
                custom === null ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setCustom('')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: c.bg2 }}
                  >
                    <Icon name="edit" size={20} color="t3" />
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

          {['pick', 'deadline', 'status', 'reply'].includes(qs.layout) ? (
            <View>
              {visible.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  layout={qs.layout}
                  on={sel.includes(it.id)}
                  onPress={qs.layout === 'reply' ? () => go(it) : qs.layout === 'deadline' ? undefined : () => toggle(it.id)}
                />
              ))}
            </View>
          ) : null}

          {qs.docLabel && doc ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${qs.docLabel} ${doc}, 변경`}
                onPress={() => setPickingDoc((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.bg2 }}
              >
                <FileTag tag={doc.split('.').pop()!.toUpperCase()} w={28} h={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text v="c2" weight="600" color="t3">
                    {qs.docLabel}
                  </Text>
                  <Text v="b2" weight="700" numberOfLines={1}>
                    {doc}
                  </Text>
                </View>
                <Text v="c1" weight="700" color="acText">
                  변경
                </Text>
              </Pressable>
              {pickingDoc
                ? docs.data?.map((x) => (
                    <Pressable
                      key={x.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: x.fileName === doc }}
                      onPress={() => (setDoc(x.fileName), setPickingDoc(false))}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 4 }}
                    >
                      <Pick on={x.fileName === doc} />
                      <Text v="b2" numberOfLines={1} style={{ flex: 1 }}>
                        {x.fileName}
                      </Text>
                    </Pressable>
                  ))
                : null}
            </>
          ) : null}
        </>
      )}
    </BottomSheet>
  )
}

const ItemRow = ({ item, layout, on, onPress }: { item: QsItem; layout: string; on: boolean; onPress?: () => void }) => {
  const status = layout === 'status'
  const content = (
    <View style={{ flexDirection: 'row', alignItems: item.body ? 'flex-start' : 'center', gap: 12, minHeight: 58, paddingVertical: item.body ? 10 : 0 }}>
      {status ? <Pick on={on} square /> : null}
      {item.logo ? <Mark text={item.logo.text} color={item.logo.color} size={status ? 40 : 44} /> : null}
      {item.avatar ? <Mark text={item.avatar.text} color={item.avatar.color} round /> : null}
      <View style={{ flex: 1, minWidth: 0, gap: item.body ? 2 : 0 }}>
        {item.over ? (
          <Text v="c1" weight="600" color="t3">
            {item.over}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
            {item.title}
          </Text>
          {layout === 'reply' && item.badge ? <Badge label={item.badge.label} tone={item.badge.tone} /> : null}
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
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {item.badge ? <Badge label={item.badge.label} tone={item.badge.tone} /> : null}
          {item.note ? (
            <Text v="c2" weight="600" color={item.note.ac ? 'acText' : 't3'}>
              {item.note.label}
            </Text>
          ) : null}
        </View>
      ) : null}
      {status && item.badge ? <Badge label={item.badge.label} tone={item.badge.tone} /> : null}
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
        gap: 12,
        padding: 14,
        borderRadius: 16,
        width: grid ? '48.5%' : undefined,
        backgroundColor: on ? c.acSoft : c.bg2,
        borderWidth: 2,
        borderColor: on ? c.ac : 'transparent',
      }}
    >
      <Pick on={on} square />
      <View style={{ flex: 1, gap: 2 }}>
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

const Calendar = ({ items, connected, task, setTask }: { items: QsItem[]; connected: boolean; task: number; setTask: (n: number) => void }) => {
  const c = useColors()
  return (
    <>
      <View style={{ paddingVertical: 4, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.bg2 }}>
        <Text v="c1" weight="700" color="t3" style={{ paddingTop: 8 }}>
          이번 주 {items.length}건
        </Text>
        {items.map((e) => (
          <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
            <View style={{ width: 40, alignItems: 'center' }}>
              <Text v="c2" weight="600" color="t3">
                {e.date?.dow}
              </Text>
              <Text v="b1" weight="800">
                {e.date?.day}
              </Text>
            </View>
            <View style={{ width: 3, alignSelf: 'stretch', marginVertical: 8, borderRadius: 2, backgroundColor: c[e.date?.color ?? 'green'] }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text v="b2" weight="700" numberOfLines={1}>
                {e.title}
              </Text>
              <Text v="c2" color="t3">
                {e.sub}
              </Text>
            </View>
            {e.badge ? <Badge label={e.badge.label} tone={e.badge.tone} /> : null}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CALENDAR_TASKS.map((t, i) => {
          const on = i === task
          return (
            <Pressable
              key={t.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setTask(i)}
              style={{ width: '48.5%', gap: 6, padding: 14, borderRadius: 16, backgroundColor: on ? c.acSoft : c.bg2, borderWidth: 2, borderColor: on ? c.ac : 'transparent' }}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.bg2 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: connected ? c.green : c.t4 }} />
        <Text v="b2" style={{ flex: 1 }}>
          {connected ? 'Google 캘린더와 연결됨' : 'Google 캘린더와 연결 안 됨'}
        </Text>
      </View>
    </>
  )
}

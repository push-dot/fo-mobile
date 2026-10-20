import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { CAREER_YEARS, EMPLOYMENT_TYPES, JOB_CATEGORIES } from '@push/api-client'
import { api } from '../../lib/api'
import { searchHangul } from '../../lib/hangul-search'
import { radius, useColors } from '../../theme'
import { BottomSheet, Chip, Icon, Text, TextField } from '../../ui'
import { EMPTY, SIDOS, formatCount, sidoOf, toQuery, toggle, toggleRegion, type FilterKey, type Filters } from './filters'

const TITLES: Record<FilterKey, string> = {
  category: '직군',
  skills: '기술 스택',
  careerYears: '경력',
  location: '지역',
  employmentType: '고용형태',
}

const POPULAR_SKILLS = ['React', 'TypeScript', 'Python', 'Go', 'Kubernetes']
// shortcut: fixed catalog for 기술 검색; switch to a skills endpoint once push-be has one.
const SKILL_CATALOG = [
  'Java', 'Kotlin', 'Spring Boot', 'JPA', 'MySQL', 'PostgreSQL', 'Redis', 'Kafka', 'AWS', 'Kubernetes', 'Docker',
  'Go', 'gRPC', 'Node.js', 'TypeScript', 'JavaScript', 'React', 'Vue', 'Next.js', 'Swift', 'SwiftUI', 'Android',
  'Python', 'PyTorch', 'SQL', 'C++', 'Figma',
]

type Props = {
  kind: FilterKey | null
  value: Filters
  onApply: (f: Filters) => void
  onClose: () => void
}

/** One sheet per filter chip. Edits a draft; the CTA shows the live count and applies it. */
export function FilterSheet({ kind, value, onApply, onClose }: Props) {
  // Remount per open so the draft starts from the applied filters.
  return kind ? <Sheet key={kind} kind={kind} value={value} onApply={onApply} onClose={onClose} /> : null
}

function Sheet({ kind, value, onApply, onClose }: Props & { kind: FilterKey }) {
  const [draft, setDraft] = useState(value)
  const set = (list: Filters[FilterKey]) => setDraft({ ...draft, [kind]: list })
  const count = useQuery({
    queryKey: ['postings', 'count', toQuery(draft)],
    queryFn: () => api.postings.list({ ...toQuery(draft), limit: 1 }),
    placeholderData: keepPreviousData,
  })
  const total = count.data?.page.total
  return (
    <BottomSheet
      visible
      onClose={onClose}
      action={{ label: total === undefined ? '공고 보기' : `공고 ${formatCount(total)}개 보기`, onPress: () => onApply(draft) }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text v="h2" accessibilityRole="header">
          {TITLES[kind]}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => set(EMPTY[kind])} hitSlop={12}>
          <Text v="c1" weight="700" color="acText">
            초기화
          </Text>
        </Pressable>
      </View>
      {kind === 'category' ? (
        <Options options={JOB_CATEGORIES} selected={draft.category} onToggle={(k) => set(toggle(draft.category, k))} />
      ) : kind === 'careerYears' ? (
        <Options options={CAREER_YEARS} selected={draft.careerYears} onToggle={(k) => set(toggle(draft.careerYears, k))} />
      ) : kind === 'employmentType' ? (
        <Options options={EMPLOYMENT_TYPES} selected={draft.employmentType} onToggle={(k) => set(toggle(draft.employmentType, k))} />
      ) : kind === 'skills' ? (
        <Skills selected={draft.skills} onToggle={(s) => set(toggle(draft.skills, s))} />
      ) : (
        <Regions draft={draft} onToggle={(v) => set(toggleRegion(draft.location, v))} />
      )}
    </BottomSheet>
  )
}

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={{ gap: 10 }}>
    <Text v="b2" weight="700">
      {title}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
  </View>
)

function Options<K extends string>({ options, selected, onToggle }: { options: { key: K; label: string }[]; selected: K[]; onToggle: (k: K) => void }) {
  return (
    <Group title="여러 개 고를 수 있어요">
      {options.map((o) => (
        <Chip key={o.key} label={o.label} check on={selected.includes(o.key)} onPress={() => onToggle(o.key)} />
      ))}
    </Group>
  )
}

function Skills({ selected, onToggle }: { selected: string[]; onToggle: (s: string) => void }) {
  const [q, setQ] = useState('')
  // me/profile may 404 before onboarding; the section just hides then.
  const profile = useQuery({ queryKey: ['me', 'profile'], queryFn: api.me.profile, retry: false })
  const mine = (profile.data?.skills ?? []).filter((s) => !selected.includes(s))
  const popular = POPULAR_SKILLS.filter((s) => !selected.includes(s))
  const found = q.trim() ? searchHangul(SKILL_CATALOG, q, (s) => [s]).map((r) => r.item) : []
  return (
    <>
      <TextField icon="search" placeholder="기술 검색" value={q} onChangeText={setQ} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
      {q.trim() ? (
        <Group title="검색 결과">
          {found.length ? (
            found.map((s) => <Chip key={s} label={s} check on={selected.includes(s)} onPress={() => onToggle(s)} />)
          ) : (
            <Text v="b2" color="t3">
              맞는 기술이 없어요. 다른 이름으로 찾아보세요.
            </Text>
          )}
        </Group>
      ) : null}
      {selected.length ? (
        <Group title="선택한 기술">
          {selected.map((s) => (
            <Chip key={s} label={s} on removable onPress={() => onToggle(s)} />
          ))}
        </Group>
      ) : null}
      {mine.length ? (
        <Group title="내 프로필 기술">
          {mine.map((s) => (
            <Chip key={s} label={s} onPress={() => onToggle(s)} />
          ))}
        </Group>
      ) : null}
      {popular.length ? (
        <Group title="많이 찾는 기술">
          {popular.map((s) => (
            <Chip key={s} label={s} onPress={() => onToggle(s)} />
          ))}
        </Group>
      ) : null}
    </>
  )
}

function Regions({ draft, onToggle }: { draft: Filters; onToggle: (v: string) => void }) {
  const c = useColors()
  const [sido, setSido] = useState<string>(draft.location[0] ? sidoOf(draft.location[0]) : SIDOS[0])
  const counts = useQuery({
    queryKey: ['postings', 'locations', toQuery({ ...draft, location: [] })],
    queryFn: () => api.postings.locations(toQuery({ ...draft, location: [] })),
    placeholderData: keepPreviousData,
  })
  const districts = (counts.data ?? []).filter((d) => sidoOf(d.location) === sido && d.location !== sido)
  const sidoTotal = (counts.data ?? []).filter((d) => sidoOf(d.location) === sido).reduce((n, d) => n + d.count, 0)
  const rows = [{ value: sido, label: sido === '원격' ? '원격' : `${sido} 전체`, count: sidoTotal }].concat(
    districts.map((d) => ({ value: d.location, label: d.location.slice(sido.length + 1), count: d.count })),
  )
  return (
    <View style={{ flexDirection: 'row', gap: 8, height: 300 }}>
      <View style={{ width: 112, gap: 2, borderRightWidth: 1, borderColor: c.line, paddingRight: 8 }}>
        {SIDOS.map((s) => {
          const picked = draft.location.filter((l) => sidoOf(l) === s).length
          return (
            <Row
              key={s}
              label={s}
              on={s === sido}
              count={picked ? String(picked) : ''}
              onPress={() => setSido(s)}
            />
          )
        })}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2 }} nestedScrollEnabled>
        {rows.map((r) => (
          <Row key={r.value} label={r.label} count={formatCount(r.count)} check on={draft.location.includes(r.value)} onPress={() => onToggle(r.value)} />
        ))}
      </ScrollView>
    </View>
  )
}

function Row({ label, count, on, check, onPress }: { label: string; count: string; on: boolean; check?: boolean; onPress: () => void }) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: on ? c.acSoft : undefined }}
    >
      <Text v="b1" weight={on ? '700' : '400'} color={on ? 'acText' : 't1'} style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {count ? (
        <Text v="c1" color={on ? 'acText' : 't3'}>
          {count}
        </Text>
      ) : null}
      {on && check ? <Icon name="check" size={16} color="acText" /> : null}
    </Pressable>
  )
}

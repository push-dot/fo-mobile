import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { searchHangul } from '../../lib/hangul-search'
import { useColors } from '../../theme'
import { GlassButton, Text, TextField, TopBar } from '../../ui'
import { chatApi, type ConversationRow } from './api'
import { statusBadge } from './Drawer'
import { ago } from './parts'

const dayStart = () => new Date(new Date().setHours(0, 0, 0, 0)).getTime()

/** Groups by 오늘 / 이번 주 / 이전 (last 7 days count as 이번 주). */
const groups = (rows: ConversationRow[]) => {
  const today = dayStart()
  const week = today - 6 * 86_400_000
  const out: { title: string; rows: ConversationRow[] }[] = [
    { title: '오늘', rows: [] },
    { title: '이번 주', rows: [] },
    { title: '이전', rows: [] },
  ]
  for (const r of rows) {
    const t = new Date(r.updatedAt).getTime()
    out[t >= today ? 0 : t >= week ? 1 : 2]!.rows.push(r)
  }
  return out.filter((g) => g.rows.length)
}

/** 전체 대화 목록 (ChatList): search, 오늘/이번 주, status badges and last progress line. */
export function ConversationsScreen() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState('')
  const list = useQuery({ queryKey: ['conversations', 'all'], queryFn: () => chatApi.conversations({ limit: 100 }) })
  const rows = searchHangul(list.data?.data ?? [], q, (r) => [r.title, r.lastLine ?? '']).map((x) => x.item)
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="대화"
        onBack={() => router.back()}
        right={<GlassButton actions={[{ icon: 'edit', label: '새 대화', onPress: () => router.dismissTo('/chat') }]} />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardDismissMode="on-drag">
        <View style={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 6 }}>
          <TextField icon="search" placeholder="대화 검색" value={q} onChangeText={setQ} returnKeyType="search" accessibilityLabel="대화 검색" />
        </View>
        {groups(rows).map((g) => (
          <View key={g.title}>
            <Text v="c1" weight="700" color="t3" style={{ paddingTop: 14, paddingHorizontal: 24, paddingBottom: 8 }}>
              {g.title}
            </Text>
            {g.rows.map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={() => router.push(`/chat/${r.id}`)}
                style={({ pressed }) => ({ paddingVertical: 14, paddingHorizontal: 20, gap: 3, backgroundColor: pressed ? c.fill : 'transparent' })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {r.title}
                  </Text>
                  {statusBadge(r.status)}
                  <Text v="c2" color="t3" style={{ marginLeft: 'auto' }}>
                    {ago(r.updatedAt)}
                  </Text>
                </View>
                {r.lastLine ? (
                  <Text v="b2" color="t3" numberOfLines={1}>
                    {r.lastLine}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ))}
        {list.data && rows.length === 0 ? (
          <Text v="b2" color="t3" style={{ padding: 32, textAlign: 'center' }}>
            {q ? `“${q}”에 맞는 대화가 없어요` : '아직 대화가 없어요'}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  )
}

import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { docMeta, postingMeta, requestMaterialFile, submitMaterialText, useChatDocs } from '@/features/chat'
import { useBookmarkList } from '@/features/my'
import { Button, Chip, GlassButton, Icon, Sheet, SheetScroll, Text, TextField, useSheetScrollMax, type IconName } from '@/shared/components'
import { onAccent, selectedRing, spacing, type, useColors } from '@/theme'

type Row = { id: string; title: string; meta: string }

// `.pnl-sub { padding: 10px 4px 2px }`
const SECTION_LABEL = { paddingTop: 10, paddingBottom: 2, paddingHorizontal: spacing[1] }

const MaterialsScreen = () => {
  const c = useColors()
  const ring = selectedRing(c)
  const bound = useSheetScrollMax(0.6)
  const [kind, setKind] = useState<'github' | 'posting' | null>(null)
  const [text, setText] = useState('')
  const [picks, setPicks] = useState<string[]>([])
  const docs = useChatDocs()
  const bookmarks = useBookmarkList(true)
  const sections: { title: string; rows: Row[] }[] = [
    { title: '마이 › 서류', rows: (docs.data ?? []).map((d) => ({ id: d.id, title: d.fileName, meta: docMeta(d) })) },
    { title: '홈 › 북마크 공고', rows: (bookmarks.data?.data ?? []).map((p) => ({ id: p.id, title: `${p.company} · ${p.title}`, meta: postingMeta(p) })) },
  ]
  const toggle = (id: string) => setPicks((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const done = (value: string) => {
    submitMaterialText(value)
    router.back()
  }
  const add = () => done(sections.flatMap((s) => s.rows).filter((r) => picks.includes(r.id)).map((r) => r.title).join(', '))
  const submit = () => text.trim() && done(text.trim())
  const others: [string, IconName, () => void][] = [
    ['파일', 'pdf', () => (requestMaterialFile(), router.back())],
    ['GitHub 링크', 'at', () => setKind('github')],
    ['공고 붙여넣기', 'doc', () => setKind('posting')],
  ]
  return (
    <Sheet gap={spacing[2]} onLayout={bound.onSheetLayout} action={kind ? { label: '넣기', onPress: submit, disabled: !text.trim() } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingTop: spacing[1], paddingBottom: spacing[2] }}>
        {Platform.OS === 'ios' ? <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} /> : null}
        <Text v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          자료 고르기
        </Text>
        {kind ? null : <Button size="sm" label={`${picks.length}개 추가`} disabled={!picks.length} onPress={add} />}
      </View>
      {kind ? (
        <TextField
          value={text}
          onChangeText={setText}
          placeholder={kind === 'github' ? 'https://github.com/' : 'https://'}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          autoFocus
          onSubmitEditing={submit}
          accessibilityLabel={kind === 'github' ? 'GitHub 링크' : '공고 링크'}
        />
      ) : (
        <SheetScroll style={{ maxHeight: bound.maxHeight }} onLayout={bound.onScrollLayout} contentContainerStyle={{ gap: spacing[2] }}>
          {sections.map((s) =>
            s.rows.length ? (
              <View key={s.title} style={{ gap: spacing[2] }}>
                <Text v="c1" weight="700" color="t3" style={SECTION_LABEL}>
                  {s.title}
                </Text>
                {s.rows.map((r) => {
                  const on = picks.includes(r.id)
                  return (
                    <Pressable
                      key={r.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      onPress={() => toggle(r.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: spacing[3],
                        minHeight: 64,
                        paddingVertical: spacing[3] - ring.borderWidth,
                        paddingHorizontal: 14 - ring.borderWidth,
                        borderRadius: 14,
                        ...(on ? ring : { borderWidth: ring.borderWidth, borderColor: 'transparent' }),
                      }}
                    >
                      <View style={{ width: 24, height: 24, marginTop: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ac : c.fill }}>
                        {on ? <Icon name="check" size={14} color={onAccent} /> : null}
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text v="b1" weight="600" color={on ? 'acText' : 't1'} numberOfLines={1} style={{ lineHeight: type.b2.lineHeight }}>
                          {r.title}
                        </Text>
                        <Text v="c1" weight="500" color={on ? 'acText' : 't3'} numberOfLines={1}>
                          {r.meta}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ) : null,
          )}
          <Text v="c1" weight="700" color="t3" style={SECTION_LABEL}>
            다른 곳에서
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], padding: spacing[1] }}>
            {others.map(([label, icon, onPress]) => (
              <Chip key={label} label={label} lead={<Icon name={icon} size={16} color="t2" />} onPress={onPress} />
            ))}
          </View>
        </SheetScroll>
      )}
    </Sheet>
  )
}

export default MaterialsScreen

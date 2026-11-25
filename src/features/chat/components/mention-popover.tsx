import { brandColor } from '@push/shared'
import { useEffect, useRef, type ComponentRef } from 'react'
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '../../../theme'
import { Text, useKeyboardHeight } from '@/shared/components'
import { toBoxShadow } from '@/shared/utility'
import { useMentionGroups } from '../api/hooks'
import { filterMentions, mentionMaxHeight, type MentionItem } from '../utils/mentions'
import { mentionListMarginBottom } from '../utils/composer-geometry'
import Appear from './motion'
import Mark from './mark'

const MentionPopover = ({ query, onPick }: { query: string; onPick: (m: MentionItem) => void }) => {
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const maxHeight = mentionMaxHeight(height, insets.top, keyboard || insets.bottom + spacing[4])
  const groups = filterMentions(useMentionGroups(), query)
  const firstId = query ? groups[0]?.items[0]?.id : undefined
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const toTop = () => scroll.current?.scrollTo({ y: 0, animated: false })
  useEffect(toTop, [query])
  return (
    <Appear duration={250} style={styles.appear}>
      <View style={styles.card}>
        <ScrollView ref={scroll} onLayout={toTop} style={styles.scroll(maxHeight)} contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
          {groups.length === 0 ? (
            <Text v="b2" color="t3" style={styles.empty}>
              “{query}”에 맞는 항목이 없어요
            </Text>
          ) : (
            groups.map((g) => (
              <View key={g.title}>
                <Text v="c2" weight="700" color="t3" style={styles.group}>
                  {g.title}
                </Text>
                {g.items.map((m) => (
                  <Pressable
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${g.title}, ${m.title}`}
                    onPress={() => onPick(m)}
                    style={({ pressed }) => [styles.item, (m.id === firstId || pressed) && styles.itemOn]}
                  >
                    {m.kind === 'job' ? <Mark text={m.tag ?? ''} color={brandColor(m.tag ?? '')} size={36} /> : null}
                    <View style={styles.text}>
                      <Text v="b2" weight="600" numberOfLines={1} style={styles.line}>
                        {m.title}
                      </Text>
                      {m.sub ? (
                        <Text v="c2" color="t3" weight={m.id === firstId ? '700' : '400'} numberOfLines={1} style={styles.line}>
                          {m.sub}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Appear>
  )
}

const ios = Platform.OS === 'ios'

const styles = StyleSheet.create((theme) => ({
  appear: { marginBottom: mentionListMarginBottom },
  card: {
    ...(ios ? theme.shadow.pop : { boxShadow: toBoxShadow(theme.shadow.pop) }),
    borderRadius: ios ? 26 : theme.radius.lg,
    backgroundColor: ios ? theme.colors.bg : theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: 'hidden',
  },
  scroll: (maxHeight: number) => ({ maxHeight }),
  content: { padding: theme.spacing[2] },
  empty: { padding: 10 },
  group: { paddingTop: 9, paddingHorizontal: 10, paddingBottom: 5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], padding: 10, borderRadius: theme.radius.sm, backgroundColor: 'transparent' },
  itemOn: { backgroundColor: theme.colors.fill },
  text: { flex: 1, minWidth: 0 },
  line: { lineHeight: 21 },
}))

export default MentionPopover

import { brandColor } from '@push/shared'
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, spacing, useColors, useShadow } from '../../../theme'
import { Text, useKeyboardHeight } from '@/shared/components'
import { toBoxShadow } from '@/shared/utility'
import { useMentionGroups } from '../api/hooks'
import { filterMentions, mentionMaxHeight, type MentionItem } from '../utils/mentions'
import { Appear } from './motion'
import Mark from './mark'

const MentionPopover = ({ query, onPick }: { query: string; onPick: (m: MentionItem) => void }) => {
  const c = useColors()
  const shadow = useShadow()
  const ios = Platform.OS === 'ios'
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const maxHeight = mentionMaxHeight(height, insets.top, keyboard || insets.bottom + spacing[4])
  const groups = filterMentions(useMentionGroups(), query)
  const firstId = query ? groups[0]?.items[0]?.id : undefined
  return (
    <Appear duration={250} style={{ marginBottom: spacing[2] }}>
      <View style={[ios ? shadow.pop : { boxShadow: toBoxShadow(shadow.pop) }, { borderRadius: ios ? 26 : radius.lg, backgroundColor: ios ? c.bg : c.card, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }]}>
        <ScrollView style={{ maxHeight }} contentContainerStyle={{ padding: spacing[2] }} keyboardShouldPersistTaps="always">
          {groups.length === 0 ? (
            <Text v="b2" color="t3" style={{ padding: 10 }}>
              “{query}”에 맞는 항목이 없어요
            </Text>
          ) : (
            groups.map((g) => (
              <View key={g.title}>
                <Text v="c2" weight="700" color="t3" style={{ paddingTop: spacing[2], paddingHorizontal: 10, paddingBottom: spacing[1] }}>
                  {g.title}
                </Text>
                {g.items.map((m) => (
                  <Pressable
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${g.title}, ${m.title}`}
                    onPress={() => onPick(m)}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: 10, borderRadius: radius.sm, backgroundColor: m.id === firstId || pressed ? c.fill : 'transparent' })}
                  >
                    {m.kind === 'job' ? <Mark text={m.tag ?? ''} color={brandColor(m.tag ?? '')} size={36} /> : null}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text v="b2" weight="600" numberOfLines={1} style={{ lineHeight: 21 }}>
                        {m.title}
                      </Text>
                      {m.sub ? (
                        <Text v="c2" color="t3" numberOfLines={1} style={{ lineHeight: 21 }}>
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

export default MentionPopover

import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fontFor, useColors } from '../../theme'
import { Glass, GlassButton, Icon3D, Text } from '../../ui'
import { ComposerArea } from './ComposerArea'
import { ChatDrawer } from './Drawer'
import { useStartChat } from './parts'
import { QuickStartSheet } from './QuickStartSheet'
import { QUICK_STARTS, type QuickStart } from './quickStarts'

/** AI 채팅 first screen (ChatHome): faint Push. mark, quick-start pills, composer. Tab bar stays. */
export function ChatHomeScreen() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const start = useStartChat()
  const [typing, setTyping] = useState(false)
  const [qs, setQs] = useState<QuickStart | null>(null)
  const [drawer, setDrawer] = useState(false)

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top, height: insets.top + 56, justifyContent: 'center', paddingLeft: 12 }}>
        <GlassButton actions={[{ icon: 'side', label: '대화 목록 열기', onPress: () => setDrawer(true) }]} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none" accessibilityElementsHidden>
        <Text style={{ fontSize: 56, lineHeight: 60, letterSpacing: -2.8, ...fontFor('800'), color: c.t1, opacity: 0.12 }}>
          Push<Text style={{ fontSize: 56, lineHeight: 60, ...fontFor('800'), color: c.ac }}>.</Text>
        </Text>
      </View>
      {!typing ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, padding: 16 }} style={{ flexGrow: 0 }}>
          {QUICK_STARTS.map((q) => (
            <QuickStartPill key={q.key} qs={q} onPress={() => setQs(q)} />
          ))}
        </ScrollView>
      ) : null}
      <View style={{ paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 10) }}>
        <ComposerArea
          placeholder="공고 링크를 붙여넣어 보세요"
          onTyping={setTyping}
          onShortcut={setQs}
          onSend={(text, attachment) => void start(text.length > 30 ? `${text.slice(0, 30)}…` : text, text, attachment)}
        />
      </View>
      <QuickStartSheet qs={qs} onClose={() => setQs(null)} />
      <ChatDrawer visible={drawer} onClose={() => setDrawer(false)} />
    </KeyboardAvoidingView>
  )
}

/** 52px pill: 30px 3D icon + short verb phrase. Opens the ingredient sheet, never sends. */
function QuickStartPill({ qs, onPress }: { qs: QuickStart; onPress: () => void }) {
  const c = useColors()
  const inner = (
    <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 18 }}>
      <Icon3D name={qs.icon} size={30} />
      <Text v="b2" weight="600">
        {qs.label}
      </Text>
    </View>
  )
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      {Platform.OS === 'ios' ? (
        <Glass interactive style={{ borderRadius: 26 }}>
          {inner}
        </Glass>
      ) : (
        <View style={{ borderRadius: 26, backgroundColor: c.bg2 }}>{inner}</View>
      )}
    </Pressable>
  )
}

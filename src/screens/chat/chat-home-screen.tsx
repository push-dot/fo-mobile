import { router, useNavigation } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fontFor, spacing, useColors } from '@/theme'
import { Glass, GlassButton, Icon3D, Text } from '@/shared/components'
import { ComposerArea, ConsentSheet, OPEN_DRAWER, QUICK_STARTS, quickStartPath, useKeyboardHeight, useStartChat, type QuickStart } from '@/features/chat'


const ChatHomeScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const start = useStartChat()
  const [typing, setTyping] = useState(false)
  const navigation = useNavigation()
  // The floating iOS tab bar is inside the inset; the design keeps the composer a step above it.
  const lift = Platform.OS === 'ios' && insets.bottom > 0 ? spacing[4] : 0
  // Android pads the keyboard height itself; the nav-bar inset on top of it would leave a gap.
  const keyboard = useKeyboardHeight()

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding">
      <View style={{ paddingTop: insets.top, height: insets.top + 56, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: spacing[3] }}>
        <GlassButton actions={[{ icon: 'side', label: '대화 목록 열기', onPress: () => navigation.dispatch(OPEN_DRAWER) }]} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none" accessibilityElementsHidden>
        <Text style={{ fontSize: 56, lineHeight: 60, letterSpacing: -2.8, ...fontFor('800'), color: c.t1, opacity: 0.12 }}>
          Push<Text style={{ fontSize: 56, lineHeight: 60, ...fontFor('800'), color: c.ac }}>.</Text>
        </Text>
      </View>
      {!typing ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2], padding: spacing[4] }} style={{ flexGrow: 0 }}>
          {QUICK_STARTS.map((q) => (
            <QuickStartPill key={q.key} qs={q} onPress={() => router.push(quickStartPath(q.key))} />
          ))}
        </ScrollView>
      ) : null}
      <View style={{ paddingHorizontal: spacing[3], paddingBottom: Platform.OS === 'android' && keyboard ? 10 : Math.max(insets.bottom + lift, 10) }}>
        <ComposerArea
          placeholder="공고 링크를 붙여넣어 보세요"
          onTyping={setTyping}
          onShortcut={() => undefined}
          onSend={(text, attachment) => void start(text.length > 30 ? `${text.slice(0, 30)}…` : text, text, attachment)}
        />
      </View>
      <ConsentSheet />
    </KeyboardAvoidingView>
  )
}

const QuickStartPill = ({ qs, onPress }: { qs: QuickStart; onPress: () => void }) => {
  const c = useColors()
  const ios = Platform.OS === 'ios'
  // iOS: the interactive glass gives the press response, so the Pressable adds none of its own.
  const pressable = (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: c.fill2 }}
      style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingLeft: spacing[3], paddingRight: spacing[5] }}
    >
      <Icon3D name={qs.icon} size={30} />
      <Text v="b2" weight="600">
        {qs.label}
      </Text>
    </Pressable>
  )
  return ios ? (
    <Glass interactive style={{ borderRadius: 26 }}>
      {pressable}
    </Glass>
  ) : (
    <View style={{ borderRadius: 26, overflow: 'hidden', backgroundColor: c.bg2 }}>{pressable}</View>
  )
}

export default ChatHomeScreen

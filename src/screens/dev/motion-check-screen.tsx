/* eslint-disable no-restricted-syntax, feature-boundaries/no-deep-import -- temporary diagnostic page, removed in the last commit of r83/a */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Pressable, Text as RNText, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Appear, RowMotion } from '@/features/chat/components/motion'
import { ApprovalPanel } from '@/features/chat/components/card/approval-panel'
import { usePop, usePulse } from '@/features/chat/hooks'
import type { Approval } from '@/features/chat/types'
import { showToast, useReduceMotion } from '@/shared/components'

// Dev-only check page (mock builds): every entry motion beside the rect it must end on. The red outline is the end rect, the blue
// fill is the animated view; when the motion ends where it should, the blue fills the outline and nothing leaks past it.
const REF = '#FF0000'
const FILL = 'rgba(0,0,255,0.55)'
const LEFT = 20
const CELL = 44
const DONE_MS = 1800

const APPROVAL: Approval = {
  id: 'motion-check',
  question: '어떻게 할까요?',
  sections: [{ kind: 'choices', items: [{ label: '첫 번째' }, { label: '두 번째' }], multi: false, selected: [] }],
  optionIds: ['a', 'b'],
}

const Ref = ({ name, width, height = CELL, left = LEFT }: { name: string; width: number; height?: number; left?: number }) => (
  <View testID={`ref-${name}`} pointerEvents="none" style={{ position: 'absolute', left, top: 0, width, height, borderWidth: 1, borderColor: REF, zIndex: 2 }} />
)

const Blue = () => <View style={{ flex: 1, backgroundColor: FILL }} />

const Cell = ({ name, children }: { name: string; children: ReactNode }) => (
  <View style={{ height: CELL + 14, justifyContent: 'flex-end' }}>
    <RNText style={{ position: 'absolute', top: 0, left: LEFT, fontSize: 10, color: '#444' }}>{name}</RNText>
    <View testID={`cell-${name}`} style={{ height: CELL }}>
      {children}
    </View>
  </View>
)

const box = (width: number, left = LEFT) => ({ position: 'absolute' as const, left, top: 0, width, height: CELL })

const Rows = ({ nonce }: { nonce: number }) => {
  const [late, setLate] = useState(false)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => setLate(true), 900)
    const b = setTimeout(() => setOn(true), 100)
    return () => (clearTimeout(a), clearTimeout(b))
  }, [])
  const pop = usePop(on)
  const pulse = usePulse(false)
  return (
    <>
      <Cell name="up">
        <Ref name="up" width={300} />
        <Appear style={box(300)}>
          <Blue />
        </Appear>
      </Cell>
      <Cell name="bubble">
        <Ref name="bubble" width={240} left={142} />
        <Appear kind="bubble" style={box(240, 142)}>
          <Blue />
        </Appear>
      </Cell>
      <Cell name="fade">
        <Ref name="fade" width={300} />
        <Appear kind="fade" style={box(300)}>
          <Blue />
        </Appear>
      </Cell>
      <Cell name="row-live">
        <Ref name="row-live" width={240} left={142} />
        <RowMotion.Provider value={{ key: `motion-check-live-${nonce}`, live: true }}>
          <Appear kind="bubble" style={box(240, 142)}>
            <Blue />
          </Appear>
        </RowMotion.Provider>
      </Cell>
      <Cell name="row-again">
        <Ref name="row-again" width={240} left={142} />
        {late ? (
          <RowMotion.Provider value={{ key: `motion-check-live-${nonce}`, live: true }}>
            <Appear kind="bubble" style={box(240, 142)}>
              <Blue />
            </Appear>
          </RowMotion.Provider>
        ) : null}
      </Cell>
      <Cell name="row-still">
        <Ref name="row-still" width={240} left={142} />
        <RowMotion.Provider value={{ key: `motion-check-still-${nonce}`, live: false }}>
          <Appear kind="bubble" style={box(240, 142)}>
            <Blue />
          </Appear>
        </RowMotion.Provider>
      </Cell>
      <Cell name="delay">
        <Ref name="delay" width={300} />
        <Appear delay={300} style={box(300)}>
          <Blue />
        </Appear>
      </Cell>
      <Cell name="pop">
        <Ref name="pop" width={120} />
        <Animated.View style={[box(120), { transform: [{ scale: pop }] }]}>
          <Blue />
        </Animated.View>
      </Cell>
      <Cell name="pulse-off">
        <Ref name="pulse-off" width={120} />
        <Animated.View style={[box(120), { opacity: pulse }]}>
          <Blue />
        </Animated.View>
      </Cell>
    </>
  )
}

const Btn = ({ id, label, onPress }: { id: string; label: string; onPress: () => void }) => (
  <Pressable testID={id} onPress={onPress} style={{ paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: '#E8E8ED', justifyContent: 'center' }}>
    <RNText style={{ fontSize: 14 }}>{label}</RNText>
  </Pressable>
)

const MotionCheckScreen = () => {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const reduce = useReduceMotion()
  const [nonce, setNonce] = useState(1)
  const [done, setDone] = useState(0)
  const [mode, setMode] = useState<'cells' | 'panel'>('cells')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const settle = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setDone((n) => n + 1), DONE_MS)
  }
  useEffect(() => {
    settle()
    return () => clearTimeout(timer.current)
  }, [nonce, mode])
  const ios = true
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: LEFT, height: 44 }}>
        <RNText testID="motion-rm" style={{ fontSize: 13 }}>{`RM ${reduce ? 'on' : 'off'}`}</RNText>
        <RNText testID="motion-done" style={{ fontSize: 13 }}>{`done ${done}`}</RNText>
        <Btn id="motion-replay" label="재생" onPress={() => (setMode('cells'), setNonce((n) => n + 1))} />
        <Btn id="motion-toast" label="토스트" onPress={() => showToast({ message: '모션 확인 토스트예요' })} />
        <Btn id="motion-panel" label="패널" onPress={() => (setMode('panel'), setNonce((n) => n + 1))} />
      </View>
      {mode === 'cells' ? <View testID="ref-toast" pointerEvents="none" style={{ position: 'absolute', left: 5, right: 5, top: insets.top + 2 - 3, height: 70, borderWidth: 1, borderColor: REF, borderRadius: 29, zIndex: 9 }} /> : null}
      {mode === 'cells' ? (
        <View key={nonce}>
          <Rows nonce={nonce} />
        </View>
      ) : (
        <>
          <View
            testID="ref-panel-bottom"
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: height - insets.bottom - 8, height: 1, backgroundColor: REF, zIndex: 5 }}
          />
          <View key={nonce} style={{ position: 'absolute', left: 0, right: 0, bottom: ios ? insets.bottom : 0 }}>
            <ApprovalPanel approval={APPROVAL} onAnswer={() => {}} onSay={() => {}} onMaterials={() => {}} />
          </View>
        </>
      )}
    </View>
  )
}

export default MotionCheckScreen

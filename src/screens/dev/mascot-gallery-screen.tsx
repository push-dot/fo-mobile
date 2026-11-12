import { useEffect, useState, type ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { Button, Mascot, MASCOT_STATES, Text, TopBar, type MascotMotion, type MascotState } from '@/shared/components'
import { spacing, useColors } from '@/theme'
import { MASCOT_COLORS, type MascotColor } from '@/theme/mascot'

const STATE_LABEL: Record<MascotState, string> = { idle: '대기', think: '생각', work: '작업', help: '도움 필요', done: '완료 안 읽음' }

// The frame size of the AgentHomeMascot tiles, so a capture of a tile lines up with a crop of the board.
const FRAME = 64
const TILE_HEIGHT = 112
const LIST_SIZE = 52
const SIZES = [24, 32, 52, 96, 104, 120]
const MOVING: MascotMotion = { mode: 'animate' }
const HOLDING: MascotMotion = { mode: 'frame3' }

const PROBE_MS = 3000
const PROBE_WARMUP_MS = 300
// A JS frame that runs past one 60 Hz frame makes the next callback arrive a whole frame late.
const LATE_FRAME_MS = 25
const PROBE_STEPS = MASCOT_STATES.length * 4

type ProbeRow = { state: MascotState; moving: boolean; frames: number; late: number; maxMs: number; mountMs: number }

const stepOf = (step: number) => ({ state: MASCOT_STATES[Math.floor(step / 2) % MASCOT_STATES.length]!, moving: step % 2 === 1 })

const Tile = ({ color, motion }: { color: MascotColor; motion: MascotMotion }) => {
  const c = useColors()
  return (
    <View style={{ height: TILE_HEIGHT, flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg2 }}>
      {MASCOT_STATES.map((state) => (
        <View key={state} style={{ flex: 1, alignItems: 'center' }}>
          <Mascot size={FRAME} state={state} color={color} motion={motion} accessibilityLabel={`${color} ${STATE_LABEL[state]}`} />
        </View>
      ))}
    </View>
  )
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[6], gap: spacing[4] }}>
    <Text v="c1" weight="700" color="t2">
      {title}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: spacing[5] }}>{children}</View>
  </View>
)

// Alternates one still mascot with one moving mascot and counts the JS frames that arrive late in each window.
const Probe = () => {
  const [rows, setRows] = useState<ProbeRow[]>([])
  const step = rows.length
  const done = step >= PROBE_STEPS
  const { state, moving } = stepOf(step)

  useEffect(() => {
    if (done) return
    const started = performance.now()
    const row: ProbeRow = { ...stepOf(step), frames: 0, late: 0, maxMs: 0, mountMs: 0 }
    let last = started
    let frame = requestAnimationFrame(function tick(now) {
      const gap = now - last
      last = now
      if (now - started < PROBE_WARMUP_MS) row.mountMs = Math.max(row.mountMs, gap)
      else {
        row.frames += 1
        row.maxMs = Math.max(row.maxMs, gap)
        if (gap > LATE_FRAME_MS) row.late += 1
      }
      frame = requestAnimationFrame(tick)
    })
    const timer = setTimeout(() => setRows((all) => [...all, row]), PROBE_MS)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [step, done])

  useEffect(() => {
    if (done) console.log(`[mascot-probe] ${JSON.stringify(rows)}`)
  }, [done, rows])

  return (
    <View style={{ padding: spacing[5], gap: spacing[3] }}>
      <View style={{ height: TILE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        {done ? null : <Mascot key={step} size={LIST_SIZE} state={state} color="teal" motion={moving ? MOVING : undefined} />}
      </View>
      <Text v="c1" weight="700">
        {done ? '측정 끝' : `측정 중 ${step + 1}/${PROBE_STEPS}`}
      </Text>
      {rows.map((row, i) => (
        <Text key={i} v="c2" color="t2">
          {`${row.state} ${row.moving ? 'moving' : 'still'} · frames ${row.frames} · late ${row.late} · max ${row.maxMs.toFixed(1)} ms · mount ${row.mountMs.toFixed(1)} ms`}
        </Text>
      ))}
    </View>
  )
}

const MascotGalleryScreen = ({ probe = false }: { probe?: boolean }) => {
  const c = useColors()
  const [held, setHeld] = useState(false)
  const motion = held ? HOLDING : MOVING
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="마스코트"
        onBack={() => router.back()}
        right={probe ? null : <Button size="sm" variant="secondary" label={held ? '재생' : '멈춤'} onPress={() => setHeld(!held)} />}
      />
      {probe ? (
        <Probe />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing[6] }}>
          <View style={{ flexDirection: 'row', paddingBottom: spacing[2] }}>
            {MASCOT_STATES.map((state) => (
              <Text key={state} v="c2" color="t2" style={{ flex: 1, textAlign: 'center' }}>
                {STATE_LABEL[state]}
              </Text>
            ))}
          </View>
          <View style={{ gap: spacing[3] }}>
            <Tile color="teal" motion={motion} />
            <Tile color="push" motion={motion} />
          </View>
          <Section title="안 읽음 점">
            <Mascot size={LIST_SIZE} state="done" color="teal" unread accessibilityLabel="teal 안 읽음" />
            <Mascot size={LIST_SIZE} state="done" color="push" unread accessibilityLabel="push 안 읽음" />
          </Section>
          <Section title="색">
            {[...MASCOT_COLORS, 'push' as const].map((color) => (
              <Mascot key={color} size={LIST_SIZE} color={color} accessibilityLabel={color} />
            ))}
          </Section>
          <Section title="크기">
            {SIZES.map((size) => (
              <Mascot key={size} size={size} color="teal" accessibilityLabel={`${size}`} />
            ))}
          </Section>
        </ScrollView>
      )}
    </View>
  )
}

export default MascotGalleryScreen

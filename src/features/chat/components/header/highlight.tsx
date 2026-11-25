import { createContext, Fragment, useContext, useEffect, useId, useRef, useState, type ComponentProps, type ComponentRef, type RefObject } from 'react'
import { StyleSheet, Text as RNText, View } from 'react-native'
import { Text } from '@/shared/components'
import { WORD_JOINER } from '@/shared/utility/keep-words'
import { onAccent, type as typography, useColors } from '../../../../theme'
import { MARK_RADIUS, markRects, splitMarks, type MarkEdges, type Point, type TextLine } from '../../utils/find'

export const FindHighlight = createContext<{ query: string; currentId?: string; currentHit?: number }>({ query: '' })

type Host = ComponentRef<typeof View>
type Edges = Partial<Record<'left' | 'right', Point>>
type Paint = { enlist: (key: string, side: 'left' | 'right', edge: RefObject<Host | null>) => void; drop: (key: string) => void }
const FindPaint = createContext<Paint | null>(null)
const FindDrawn = createContext<ReadonlySet<string>>(new Set())

const MARK_PAD = { left: 2, right: 1.5 }
const Pad = ({ pt }: { pt: number }) => <RNText style={{ fontSize: pt / 0.224, letterSpacing: 0 }}>{'\xa0'}</RNText>

const ZERO = { width: 0, height: 0 }

const Edge = ({ markKey, side }: { markKey: string; side: 'left' | 'right' }) => {
  const paint = useContext(FindPaint)
  const ref = useRef<Host>(null)
  useEffect(() => {
    paint?.enlist(markKey, side, ref)
    return () => paint?.drop(markKey)
  }, [paint, markKey, side])
  return <View ref={ref} collapsable={false} style={ZERO} />
}

export const Marked = ({ text, itemId, current: lineCurrent }: { text: string; itemId: string; current?: boolean }) => {
  const { query, currentId } = useContext(FindHighlight)
  const drawn = useContext(FindDrawn)
  const c = useColors()
  const id = useId()
  if (!query.trim()) return <>{text}</>
  const current = lineCurrent ?? itemId === currentId
  return (
    <>
      {splitMarks(text, query).map((mark, i) => {
        if (!mark.hit) return mark.text
        const key = `${id}:${i}`
        return (
          <Fragment key={i}>
            <Edge markKey={key} side="left" />
            <RNText style={{ color: current ? onAccent : undefined, backgroundColor: drawn.has(key) ? undefined : current ? c.ac : c.acSoft }}>
              <Pad pt={MARK_PAD.left} />
              {mark.text}
              <Pad pt={MARK_PAD.right} />
            </RNText>
            <Edge markKey={key} side="right" />
            {WORD_JOINER}
          </Fragment>
        )
      })}
    </>
  )
}

export const FindText = ({ itemId, current: lineCurrent, v = 'b2', style, onTextLayout, children, ...rest }: ComponentProps<typeof Text> & { itemId: string; current?: boolean }) => {
  const { query, currentId } = useContext(FindHighlight)
  const c = useColors()
  const fontSize = StyleSheet.flatten(style)?.fontSize ?? typography[v].fontSize
  const latest = useRef<TextLine[]>([])
  const [lines, setLines] = useState<TextLine[]>([])
  const [edges, setEdges] = useState<Record<string, Edges>>({})
  const wrapper = useRef<Host>(null)
  const listed = useRef(new Map<string, Partial<Record<'left' | 'right', RefObject<Host | null>>>>())
  const active = query.trim() !== ''
  useEffect(() => {
    if (active) setLines(latest.current)
  }, [active])
  const read = () => {
    if (!wrapper.current) return
    for (const [key, sides] of listed.current)
      for (const side of ['left', 'right'] as const)
        sides[side]?.current?.measureLayout(
          wrapper.current,
          (x, y) => setEdges((all) => (all[key]?.[side]?.x === x && all[key][side]?.y === y ? all : { ...all, [key]: { ...all[key], [side]: { x, y } } })),
          () => {},
        )
  }
  const paint: Paint = {
    enlist: (key, side, edge) => listed.current.set(key, { ...listed.current.get(key), [side]: edge }),
    drop: (key) => {
      listed.current.delete(key)
      setEdges((all) => {
        if (!(key in all)) return all
        const next = { ...all }
        delete next[key]
        return next
      })
    },
  }
  const onLines: NonNullable<ComponentProps<typeof Text>['onTextLayout']> = (e) => {
    latest.current = e.nativeEvent.lines
    if (active) {
      setLines(e.nativeEvent.lines)
      requestAnimationFrame(read)
    }
    onTextLayout?.(e)
  }
  const placed = active
    ? Object.entries(edges).flatMap(([key, e]) => (e.left && e.right ? [{ key, rects: markRects(lines, e as MarkEdges, fontSize) }] : []))
    : []
  const drawn = new Set(placed.filter((mark) => mark.rects.length).map((mark) => mark.key))
  return (
    <FindPaint.Provider value={paint}>
      <FindDrawn.Provider value={drawn}>
        <View ref={wrapper} collapsable={false}>
          {placed.flatMap((mark) =>
            mark.rects.map((box, i) => (
              <View key={`${mark.key}:${i}`} pointerEvents="none" style={{ position: 'absolute', ...box, borderRadius: MARK_RADIUS, backgroundColor: (lineCurrent ?? itemId === currentId) ? c.ac : c.acSoft }} />
            )),
          )}
          <Text v={v} style={style} onTextLayout={onLines} {...rest}>
            {children}
          </Text>
        </View>
      </FindDrawn.Provider>
    </FindPaint.Provider>
  )
}

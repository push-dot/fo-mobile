import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { StyleSheet, Text as RNText, View, type LayoutChangeEvent } from 'react-native'
import { Text } from '@/shared/components'
import { onAccent, type as typography, useColors } from '../../../../theme'
import { MARK_RADIUS, markRects, splitMarks, type MarkEdges, type Point, type TextLine } from '../../utils/find'

/** The find query and the line the current result sits in. Outside a find, the query is empty and lines draw plain. */
export const FindHighlight = createContext<{ query: string; currentId?: string }>({ query: '' })

type Edges = Partial<Record<'left' | 'right', Point>>
type Paint = { put: (key: string, side: 'left' | 'right', point: Point) => void; drop: (key: string) => void }
const FindPaint = createContext<Paint | null>(null)

// The board's mark has 2px side padding; a nested Text takes none, so a no-break space at the size where its 0.224em advance is 2pt stands in.
const PAD = { fontSize: 2 / 0.224, letterSpacing: 0 }
const Pad = () => <RNText style={PAD}>{' '}</RNText>

const ZERO = { width: 0, height: 0 }

// A zero-size inline view reports where the paragraph puts it, which is where the mark's box begins and ends: TextKit/StaticLayout give no per-word rects.
const Edge = ({ markKey, side }: { markKey: string; side: 'left' | 'right' }) => {
  const paint = useContext(FindPaint)
  useEffect(() => () => paint?.drop(markKey), [paint, markKey])
  return <View style={ZERO} onLayout={({ nativeEvent: { layout } }: LayoutChangeEvent) => paint?.put(markKey, side, { x: layout.x, y: layout.y })} />
}

export const Marked = ({ text, itemId }: { text: string; itemId: string }) => {
  const { query, currentId } = useContext(FindHighlight)
  const id = useId()
  if (!query.trim()) return <>{text}</>
  const current = itemId === currentId
  return (
    <>
      {splitMarks(text, query).map((mark, i) =>
        mark.hit ? (
          <RNText key={i} style={{ color: current ? onAccent : undefined }}>
            <Edge markKey={`${id}:${i}`} side="left" />
            <Pad />
            {mark.text}
            <Pad />
            <Edge markKey={`${id}:${i}`} side="right" />
          </RNText>
        ) : (
          mark.text
        ),
      )}
    </>
  )
}

/** A Text whose find matches sit in boxes with the board's corner radius: a nested Text's background is square, so the boxes are Views behind the paragraph. */
export const FindText = ({ itemId, v = 'b2', style, onTextLayout, children, ...rest }: ComponentProps<typeof Text> & { itemId: string }) => {
  const { query, currentId } = useContext(FindHighlight)
  const c = useColors()
  const fontSize = StyleSheet.flatten(style)?.fontSize ?? typography[v].fontSize
  // Only a find reads the lines, so a thread of plain bubbles does not render a second time for them.
  const latest = useRef<TextLine[]>([])
  const [lines, setLines] = useState<TextLine[]>([])
  const [edges, setEdges] = useState<Record<string, Edges>>({})
  const active = query.trim() !== ''
  useEffect(() => {
    if (active) setLines(latest.current)
  }, [active])
  const paint = useMemo<Paint>(
    () => ({
      put: (key, side, point) =>
        setEdges((all) => (all[key]?.[side]?.x === point.x && all[key][side]?.y === point.y ? all : { ...all, [key]: { ...all[key], [side]: point } })),
      drop: (key) =>
        setEdges((all) => {
          if (!(key in all)) return all
          const next = { ...all }
          delete next[key]
          return next
        }),
    }),
    [],
  )
  const onLines = useCallback<NonNullable<ComponentProps<typeof Text>['onTextLayout']>>(
    (e) => {
      latest.current = e.nativeEvent.lines
      if (active) setLines(e.nativeEvent.lines)
      onTextLayout?.(e)
    },
    [active, onTextLayout],
  )
  const boxes = active
    ? Object.values(edges)
        .filter((e): e is MarkEdges => !!e.left && !!e.right)
        .flatMap((e) => markRects(lines, e, fontSize))
    : []
  return (
    <FindPaint.Provider value={paint}>
      <View>
        {boxes.map((box, i) => (
          <View key={i} pointerEvents="none" style={{ position: 'absolute', ...box, borderRadius: MARK_RADIUS, backgroundColor: itemId === currentId ? c.ac : c.acSoft }} />
        ))}
        <Text v={v} style={style} onTextLayout={onLines} {...rest}>
          {children}
        </Text>
      </View>
    </FindPaint.Provider>
  )
}

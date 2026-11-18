import { createContext, Fragment, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ComponentRef, type RefObject } from 'react'
import { StyleSheet, Text as RNText, View } from 'react-native'
import { Text } from '@/shared/components'
import { WORD_JOINER } from '@/shared/utility/keep-words'
import { onAccent, type as typography, useColors } from '../../../../theme'
import { MARK_RADIUS, markRects, splitMarks, type MarkEdges, type Point, type TextLine } from '../../utils/find'

/** The find query, the line the current result sits in and which of that line's hits it is (reading order). Outside a find, the query is empty and lines draw plain. */
export const FindHighlight = createContext<{ query: string; currentId?: string; currentHit?: number }>({ query: '' })

type Host = ComponentRef<typeof View>
type Edges = Partial<Record<'left' | 'right', Point>>
type Paint = { enlist: (key: string, side: 'left' | 'right', edge: RefObject<Host | null>) => void; drop: (key: string) => void }
const FindPaint = createContext<Paint | null>(null)
/** The marks whose boxes are drawn behind the paragraph; the others fall back to the text's own background until their edges are read. */
const FindDrawn = createContext<ReadonlySet<string>>(new Set())

// The board's mark has 2px side padding; a nested Text takes none, so a no-break space at the size where its 0.224em advance is the padding stands in.
// On the right the edge view and the joiner after it cost 0.67pt more than the CSS padding (device: the text after the mark starts 0.67 later), which wrapped a line the board fits by 0.5: that pad is 0.5 short.
const MARK_PAD = { left: 2, right: 1.5 }
const Pad = ({ pt }: { pt: number }) => <RNText style={{ fontSize: pt / 0.224, letterSpacing: 0 }}>{'\xa0'}</RNText>

const ZERO = { width: 0, height: 0 }

// A zero-size inline view sits where the mark's box begins and ends: TextKit/StaticLayout give no per-word rects. React Native never fires onLayout for an
// inline view (ParagraphShadowNode::layout lays its attachments out without adding them to the affected nodes), so FindText reads the position with measureLayout.
const Edge = ({ markKey, side }: { markKey: string; side: 'left' | 'right' }) => {
  const paint = useContext(FindPaint)
  const ref = useRef<Host>(null)
  useEffect(() => {
    paint?.enlist(markKey, side, ref)
    return () => paint?.drop(markKey)
  }, [paint, markKey, side])
  return <View ref={ref} collapsable={false} style={ZERO} />
}

/** `current` overrides the default of marking every hit of the current line (a bubble with several lines passes which of them holds the current hit). */
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
        // The edges sit beside the mark's Text, not in it: a view nested in a Text cannot be measured against the paragraph. The word joiner keeps the next character on the mark's line.
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

/** A Text whose find matches sit in boxes with the board's corner radius: a nested Text's background is square, so the boxes are Views behind the paragraph. */
export const FindText = ({ itemId, current: lineCurrent, v = 'b2', style, onTextLayout, children, ...rest }: ComponentProps<typeof Text> & { itemId: string; current?: boolean }) => {
  const { query, currentId } = useContext(FindHighlight)
  const c = useColors()
  const fontSize = StyleSheet.flatten(style)?.fontSize ?? typography[v].fontSize
  // Only a find reads the lines, so a thread of plain bubbles does not render a second time for them.
  const latest = useRef<TextLine[]>([])
  const [lines, setLines] = useState<TextLine[]>([])
  const [edges, setEdges] = useState<Record<string, Edges>>({})
  const wrapper = useRef<Host>(null)
  const listed = useRef(new Map<string, Partial<Record<'left' | 'right', RefObject<Host | null>>>>())
  const active = query.trim() !== ''
  useEffect(() => {
    if (active) setLines(latest.current)
  }, [active])
  const read = useCallback(() => {
    if (!wrapper.current) return
    for (const [key, sides] of listed.current)
      for (const side of ['left', 'right'] as const)
        sides[side]?.current?.measureLayout(
          wrapper.current,
          (x, y) => setEdges((all) => (all[key]?.[side]?.x === x && all[key][side]?.y === y ? all : { ...all, [key]: { ...all[key], [side]: { x, y } } })),
          () => {},
        )
  }, [])
  const paint = useMemo<Paint>(
    () => ({
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
    }),
    [],
  )
  const onLines = useCallback<NonNullable<ComponentProps<typeof Text>['onTextLayout']>>(
    (e) => {
      latest.current = e.nativeEvent.lines
      if (active) {
        setLines(e.nativeEvent.lines)
        requestAnimationFrame(read)
      }
      onTextLayout?.(e)
    },
    [active, onTextLayout, read],
  )
  const placed = useMemo(
    () =>
      active
        ? Object.entries(edges).flatMap(([key, e]) => (e.left && e.right ? [{ key, rects: markRects(lines, e as MarkEdges, fontSize) }] : []))
        : [],
    [active, edges, lines, fontSize],
  )
  const drawn = useMemo(() => new Set(placed.filter((mark) => mark.rects.length).map((mark) => mark.key)), [placed])
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

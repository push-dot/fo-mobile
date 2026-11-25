import { useContext, useEffect, useRef, useState, type ComponentProps, type RefObject } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { type as typography } from '../../../../theme'
import { MARK_RADIUS, markRects, type MarkEdges, type Point, type TextLine } from '../../utils/find'
import { FindDrawn, FindHighlight, FindPaint, type Host, type Paint } from './find-highlight'

type Edges = Partial<Record<'left' | 'right', Point>>

const FindText = ({ itemId, current: lineCurrent, v = 'b2', style, onTextLayout, children, ...rest }: ComponentProps<typeof Text> & { itemId: string; current?: boolean }) => {
  const { query, currentId } = useContext(FindHighlight)
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
              <View key={`${mark.key}:${i}`} pointerEvents="none" style={[styles.box(box), (lineCurrent ?? itemId === currentId) ? styles.fillOn : styles.fill]} />
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

const styles = StyleSheet.create((theme) => ({
  fill: { backgroundColor: theme.colors.acSoft },
  fillOn: { backgroundColor: theme.colors.ac },
  box: (box: ReturnType<typeof markRects>[number]) => ({ position: 'absolute', ...box, borderRadius: MARK_RADIUS }),
}))

export default FindText

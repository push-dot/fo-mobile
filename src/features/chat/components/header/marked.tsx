import { Fragment, useContext, useEffect, useId, useRef } from 'react'
import { Text as RNText, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { WORD_JOINER } from '@/shared/utility/keep-words'
import { onAccent } from '../../../../theme'
import { splitMarks } from '../../utils/find'
import { FindDrawn, FindHighlight, FindPaint, type Host } from './find-highlight'

const MARK_PAD = { left: 2, right: 1.5 }
const Pad = ({ pt }: { pt: number }) => <RNText style={styles.pad(pt)}>{'\xa0'}</RNText>

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

const Marked = ({ text, itemId, current: lineCurrent }: { text: string; itemId: string; current?: boolean }) => {
  const { query, currentId } = useContext(FindHighlight)
  const drawn = useContext(FindDrawn)
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
            <RNText style={[current && styles.markOn, !drawn.has(key) && (current ? styles.fillOn : styles.fill)]}>
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

const styles = StyleSheet.create((theme) => ({
  pad: (pt: number) => ({ fontSize: pt / 0.224, letterSpacing: 0 }),
  markOn: { color: onAccent },
  fill: { backgroundColor: theme.colors.acSoft },
  fillOn: { backgroundColor: theme.colors.ac },
}))

export default Marked

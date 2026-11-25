import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { PageModal, REVIEW_TITLE, UNDO_LABEL, reviewRows, useReviewPage, type ReviewRow } from '@/features/chat'
import { Button, Text } from '@/shared/components'
import { CHOICE_HANDOFF_MS } from '@/shared/navigation'
import { iosMaterial, iosSystemFill } from '@/theme'

const BUTTON = { flex: 1, minHeight: 52, borderRadius: 26 } as const
const BODY = { fontSize: 14, lineHeight: 21 } as const
const APPLY = '적용'

const Parts = ({ row, strike }: { row: ReviewRow; strike?: boolean }) => (
  <Text v="b2" color={row.sign === '-' ? 't3' : 't1'} style={[BODY, strike && styles.strike]}>
    {row.parts.map((p, i) => (
      <Text key={i} v="b2" color={p.strong ? 'acText' : row.sign === '-' ? 't3' : 't1'} weight={p.strong ? '700' : '400'} style={BODY}>
        {p.text}
      </Text>
    ))}
  </Text>
)

const Changed = ({ row, pull }: { row: ReviewRow; pull: boolean }) => {
  const added = row.sign === '+'
  const plain = [...row.parts.map((p) => p.text), row.date].filter(Boolean).join(' ')
  return (
    <View
      accessible
      accessibilityLabel={`${added ? '새 줄' : '이전 줄'}, ${plain}`}
      style={[styles.changed, pull && styles.pull, added && styles.added]}
    >
      {added ? <View style={styles.bar} /> : null}
      <Text v="b2" color={added ? 'acText' : 'red'} weight="700" style={[BODY, styles.sign]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {added ? '+' : '−'}
      </Text>
      <View style={styles.line}>
        <View style={styles.shrink}>
          <Parts row={row} strike={!added} />
        </View>
        {row.date ? (
          <Text v="c2" color="t3" style={!added ? styles.strike : undefined}>
            {row.date}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const Plain = ({ row }: { row: ReviewRow }) => {
  switch (row.kind) {
    case 'title':
      return (
        <Text v="h2" style={styles.title}>
          {row.parts[0]!.text}
        </Text>
      )
    case 'headline':
      return (
        <Text v="c1" color="t3" style={styles.headline}>
          {row.parts[0]!.text}
        </Text>
      )
    case 'section':
      return (
        <Text v="c2" color="t3" weight="600" style={styles.section}>
          {row.parts[0]!.text}
        </Text>
      )
    case 'role':
      return (
        <View style={[styles.line, styles.role]}>
          <Text v="b2" weight="600" style={[BODY, styles.shrink]}>
            {row.parts[0]!.text}
          </Text>
          <Text v="c2" color="t3">
            {row.date}
          </Text>
        </View>
      )
    default:
      return (
        <View style={styles.plain}>
          <Parts row={row} />
        </View>
      )
  }
}

const ReviewScreen = () => {
  const request = useReviewPage((s) => s.request)
  const picked = useRef(false)
  const latest = useRef(request)
  useEffect(() => {
    latest.current = request
  }, [request])
  const mounted = useRef(false)
  useEffect(() => {
    if (!request) router.back()
  }, [request])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      queueMicrotask(() => {
        if (!mounted.current && !picked.current) latest.current?.onDismiss?.()
      })
    }
  }, [])
  if (!request) return null
  const run = (onPress?: () => void) => {
    if (picked.current || !onPress) return
    picked.current = true
    router.back()
    setTimeout(onPress, CHOICE_HANDOFF_MS)
  }
  const rows = reviewRows(request.lines)
  return (
    <PageModal
      title={REVIEW_TITLE}
      sheet
      closeFilled
      fadeAbove={56}
      footer={
        request.apply ? (
          <View style={styles.footer}>
            <Button label={UNDO_LABEL} variant="secondary" onPress={() => run(request.undo)} style={[BUTTON, styles.undo]} />
            <Button label={APPLY} onPress={() => run(request.apply)} style={BUTTON} />
          </View>
        ) : undefined
      }
    >
      <View style={styles.card}>
        {rows.map((row, i) => (row.sign ? <Changed key={i} row={row} pull={row.sign === '+' && rows[i - 1]?.sign === '-'} /> : <Plain key={i} row={row} />))}
      </View>
    </PageModal>
  )
}

const styles = StyleSheet.create((theme) => ({
  strike: { textDecorationLine: 'line-through', textDecorationColor: theme.colors.red },
  changed: {
    marginHorizontal: -theme.spacing[2],
    marginTop: 0,
    paddingVertical: 3,
    paddingLeft: theme.spacing[6],
    paddingRight: theme.spacing[2],
    borderRadius: theme.radius.xs,
    overflow: 'hidden',
    backgroundColor: theme.colors.redSoft,
  },
  pull: { marginTop: -2 },
  added: { backgroundColor: theme.colors.acSoft },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: theme.colors.ac },
  sign: { position: 'absolute', left: 9, top: 3 },
  line: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.spacing[2] },
  shrink: { flexShrink: 1 },
  title: { fontSize: 22, lineHeight: theme.type.h2.lineHeight },
  headline: { marginTop: -2, marginBottom: theme.spacing[1] },
  section: { marginTop: theme.spacing[3] },
  role: { marginTop: theme.spacing[1] },
  plain: { paddingVertical: 2 },
  footer: { flexDirection: 'row', gap: theme.spacing[2] },
  undo: { backgroundColor: iosSystemFill[theme.mode] },
  card: {
    marginHorizontal: theme.spacing[4],
    marginTop: theme.spacing[1],
    paddingTop: theme.spacing[5],
    paddingBottom: 60,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: theme.spacing[1],
    backgroundColor: theme.mode === 'dark' ? iosMaterial.dark : theme.colors.card,
  },
}))

export default ReviewScreen

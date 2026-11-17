import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { PageModal, REVIEW_TITLE, reviewRows, useReviewPage, type ReviewRow } from '@/features/chat'
import { Button, Text } from '@/shared/components'
import { CHOICE_HANDOFF_MS } from '@/shared/navigation'
import { iosMaterial, radius, spacing, useColors, useThemeMode } from '@/theme'

const BUTTON = { flex: 1, minHeight: 52, borderRadius: 26 } as const
const BODY = { fontSize: 14, lineHeight: 20 } as const
const UNDO = '되돌리기'
const APPLY = '적용'

const Parts = ({ row, strike }: { row: ReviewRow; strike?: boolean }) => {
  const c = useColors()
  return (
    <Text v="b2" color={row.sign === '-' ? 't3' : 't1'} style={[BODY, strike ? { textDecorationLine: 'line-through', textDecorationColor: c.red } : null]}>
      {row.parts.map((p, i) => (
        <Text key={i} v="b2" color={p.strong ? 'acText' : row.sign === '-' ? 't3' : 't1'} weight={p.strong ? '700' : '400'} style={BODY}>
          {p.text}
        </Text>
      ))}
    </Text>
  )
}

/** A changed line: the old one on light red, struck through with "−"; the new one on light violet with a bar at the left and "+". */
const Changed = ({ row }: { row: ReviewRow }) => {
  const c = useColors()
  const added = row.sign === '+'
  const plain = [...row.parts.map((p) => p.text), row.date].filter(Boolean).join(' ')
  return (
    <View
      accessible
      accessibilityLabel={`${added ? '새 줄' : '이전 줄'}, ${plain}`}
      style={{
        flexDirection: 'row',
        gap: 6,
        marginHorizontal: -spacing[3],
        paddingVertical: spacing[2],
        paddingHorizontal: 9,
        borderRadius: 10,
        backgroundColor: added ? c.acSoft : c.redSoft,
        borderLeftWidth: added ? 3 : 0,
        borderLeftColor: c.ac,
      }}
    >
      <Text v="b2" color={added ? 'acText' : 'red'} weight="600" style={[BODY, { width: 14, textAlign: 'center' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {added ? '+' : '−'}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[2] }}>
        <View style={{ flexShrink: 1 }}>
          <Parts row={row} strike={!added} />
        </View>
        {row.date ? (
          <Text v="c2" color="t3" style={!added ? { textDecorationLine: 'line-through', textDecorationColor: c.red } : undefined}>
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
        <Text v="h2" style={{ fontSize: 22, lineHeight: 30 }}>
          {row.parts[0]!.text}
        </Text>
      )
    case 'headline':
      return (
        <Text v="c1" color="t3">
          {row.parts[0]!.text}
        </Text>
      )
    case 'section':
      return (
        <Text v="c2" color="t3" weight="600" style={{ marginTop: spacing[4] }}>
          {row.parts[0]!.text}
        </Text>
      )
    case 'role':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[2], marginTop: spacing[1] }}>
          <Text v="b2" weight="600" style={[BODY, { flexShrink: 1 }]}>
            {row.parts[0]!.text}
          </Text>
          <Text v="c2" color="t3">
            {row.date}
          </Text>
        </View>
      )
    default:
      return <Parts row={row} />
  }
}

/** ChatApprove: the changed Push 프로필 as a page-style modal. Old lines struck on red, new lines on violet; 되돌리기 and 적용 at the bottom, fading document above them. */
const ReviewScreen = () => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
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
      footer={
        request.apply ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label={UNDO} variant="secondary" onPress={() => run(request.undo)} style={BUTTON} />
            <Button label={APPLY} onPress={() => run(request.apply)} style={BUTTON} />
          </View>
        ) : undefined
      }
    >
      <View style={{ marginHorizontal: spacing[4], paddingVertical: spacing[5], paddingHorizontal: 22, borderRadius: radius.card, gap: 6, backgroundColor: dark ? iosMaterial.dark : c.card }}>
        {rows.map((row, i) => (row.sign ? <Changed key={i} row={row} /> : <Plain key={i} row={row} />))}
      </View>
    </PageModal>
  )
}

export default ReviewScreen

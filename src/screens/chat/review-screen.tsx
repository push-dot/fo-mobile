import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { PageModal, REVIEW_TITLE, UNDO_LABEL, reviewRows, useReviewPage, type ReviewRow } from '@/features/chat'
import { Button, Text } from '@/shared/components'
import { CHOICE_HANDOFF_MS } from '@/shared/navigation'
import { iosMaterial, iosSystemFill, radius, spacing, type, useColors, useThemeMode } from '@/theme'

const BUTTON = { flex: 1, minHeight: 52, borderRadius: 26 } as const
const BODY = { fontSize: 14, lineHeight: 21 } as const
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

const Changed = ({ row, pull }: { row: ReviewRow; pull: boolean }) => {
  const c = useColors()
  const added = row.sign === '+'
  const plain = [...row.parts.map((p) => p.text), row.date].filter(Boolean).join(' ')
  return (
    <View
      accessible
      accessibilityLabel={`${added ? '새 줄' : '이전 줄'}, ${plain}`}
      style={{
        marginHorizontal: -spacing[2],
        marginTop: pull ? -2 : 0,
        paddingVertical: 3,
        paddingLeft: spacing[6],
        paddingRight: spacing[2],
        borderRadius: radius.xs,
        overflow: 'hidden',
        backgroundColor: added ? c.acSoft : c.redSoft,
      }}
    >
      {added ? <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: c.ac }} /> : null}
      <Text v="b2" color={added ? 'acText' : 'red'} weight="700" style={[BODY, { position: 'absolute', left: 9, top: 3 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {added ? '+' : '−'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[2] }}>
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
        <Text v="h2" style={{ fontSize: 22, lineHeight: type.h2.lineHeight }}>
          {row.parts[0]!.text}
        </Text>
      )
    case 'headline':
      return (
        <Text v="c1" color="t3" style={{ marginTop: -2, marginBottom: spacing[1] }}>
          {row.parts[0]!.text}
        </Text>
      )
    case 'section':
      return (
        <Text v="c2" color="t3" weight="600" style={{ marginTop: spacing[3] }}>
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
      return (
        <View style={{ paddingVertical: 2 }}>
          <Parts row={row} />
        </View>
      )
  }
}

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
      closeFilled
      fadeAbove={56}
      footer={
        request.apply ? (
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <Button label={UNDO_LABEL} variant="secondary" onPress={() => run(request.undo)} style={[BUTTON, { backgroundColor: iosSystemFill[dark ? 'dark' : 'light'] }]} />
            <Button label={APPLY} onPress={() => run(request.apply)} style={BUTTON} />
          </View>
        ) : undefined
      }
    >
      {/* `.pm-b` pads 4 above its content (ChatApprove). */}
      <View style={{ marginHorizontal: spacing[4], marginTop: spacing[1], paddingTop: spacing[5], paddingBottom: 60, paddingHorizontal: 18, borderRadius: 14, gap: spacing[1], backgroundColor: dark ? iosMaterial.dark : c.card }}>
        {rows.map((row, i) => (row.sign ? <Changed key={i} row={row} pull={row.sign === '+' && rows[i - 1]?.sign === '-'} /> : <Plain key={i} row={row} />))}
      </View>
    </PageModal>
  )
}

export default ReviewScreen

import { router } from 'expo-router'
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { botPickPath } from '@/features/bots'
import { useShareFile } from '@/features/chat'
import {
  PREVIEW_HEADINGS,
  useResumeDraft,
  useFileMenu,
  useSource,
  useUndoRemove,
  type ResumeDraft,
} from '@/features/my'
import { CtaBar, Button, FloatingHeader, Skeleton, Text, NativeTopBar, useFloatingHeader } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { counterPill, onAccent, palette, paperPage, spacing } from '@/theme'

const PAGE_INSET = 6
const PAGE_GAP = 10
const PAGE_PAD_X = 24
const PAGE_PAD_Y = 30
const A4 = 1.414
const COUNTER_BOTTOM = 92
const COUNTER_HEIGHT = 28
const CAREER_BARS = [92, 70]
const PROJECT_BARS = [88, 76, 82, 60]
const PAGE_TOP = 4

const sheet = palette.light
const LINE = { name: 33, small: 19.5, head: 20, intro: 21, title: 22, bullet: 20 }

const Bars = ({ widths }: { widths: readonly number[] }) =>
  widths.map((w) => (
    <View key={w} style={styles.bar(w)} />
  ))

const pageStyle = { width: '100%', backgroundColor: sheet.paper, borderRadius: 3 } as const

const Paper = ({ d }: { d: ResumeDraft }) => {
  const p = d.profile
  const a4 = useWindowDimensions().width * A4
  const head = (t: string) => (
    <Text
      v="c1"
      weight="800"
      style={styles.head}
    >
      {t}
    </Text>
  )
  return (
    <View style={styles.pages}>
      <View
        accessibilityLabel={`${p.displayName} 서류 미리보기`}
        style={styles.firstPage(a4)}
      >
        <Text v="h3" weight="800" style={styles.name}>
          {p.displayName}
        </Text>
        <Text v="c1" weight="400" style={styles.contact}>
          {[d.email, ...d.links].filter(Boolean).join(' · ')}
        </Text>
        <Text v="b2" weight="400" style={styles.intro}>
          {p.intro}
        </Text>
        {head(PREVIEW_HEADINGS[0])}
        {p.careers.map((cr, i) => (
          <View key={`${cr.company}-${cr.startedOn}`} style={[styles.career, i > 0 && styles.careerNext]}>
            <Text v="b2" weight="700" style={styles.careerTitle}>
              {cr.company} · {cr.role}{' '}
              <Text v="b2" weight="500" style={styles.careerPeriod}>
                {cr.startedOn.replace('-', '.')} – {cr.endedOn?.replace('-', '.') ?? '현재'}
              </Text>
            </Text>
            {cr.description ? (
              <Text v="b2" weight="400" style={styles.careerBody}>
                {cr.description
                  .split('\n')
                  .filter(Boolean)
                  .map((line) => `· ${line}`)
                  .join('\n')}
              </Text>
            ) : (
              <Bars widths={CAREER_BARS} />
            )}
          </View>
        ))}
        {head(PREVIEW_HEADINGS[1])}
        {d.projects?.length ? (
          d.projects.map((project) => (
            <Text key={project} v="c1" weight="400" style={styles.small}>
              {project}
            </Text>
          ))
        ) : (
          <Bars widths={PROJECT_BARS} />
        )}
        {head(PREVIEW_HEADINGS[2])}
        <Text v="c1" weight="400" style={styles.small}>
          {p.skills.join(' · ')}
        </Text>
      </View>
      {Array.from({ length: Math.max((d.pageCount ?? 1) - 1, 0) }, (_, i) => (
        <View key={i} style={styles.extraPage(a4)} />
      ))}
    </View>
  )
}

const DocViewerScreen = ({ id }: { id: string }) => {
  const insets = useSafeAreaInsets()
  const floating = useFloatingHeader()
  const { scrolled, onHeight, onScroll } = floating
  const inset = Platform.OS === 'ios' ? 0 : floating.inset
  const doc = useSource(id)
  const share = useShareFile()
  const draft = useResumeDraft(id)
  useUndoRemove(() => router.back())
  const s = doc.data
  const openMenu = useFileMenu(s)
  const d = draft.data

  return (
    <View style={styles.screen}>
      <FloatingHeader scrolled={scrolled} onHeight={onHeight}>
      <NativeTopBar
        transparent
        title={s ? displayName(s.fileName) : '서류 보기'}
        onBack={() => router.back()}
        actions={[
          { icon: 'share', label: '공유', onPress: () => (s ? share.mutate({ sourceId: id, name: s.fileName, mimeType: s.mimeType }) : doc.isError && share.mutate({ documentId: id })) },
          { icon: 'more', label: '더 보기', onPress: openMenu },
        ]}
      />
      </FloatingHeader>
      <ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={styles.content(inset)}>
        {d ? (
          <Paper d={d} />
        ) : draft.isPending ? (
          <Skeleton width="100%" height={420} radius={0} />
        ) : (
          <Text v="b2" color="t3" style={styles.empty}>
            미리보기는 곧 볼 수 있어요
          </Text>
        )}
      </ScrollView>
      {d?.pageCount ? (
        <View style={styles.counter(insets.bottom)}>
          <Text v="c1" weight="600" style={styles.counterLabel}>
            {`1 / ${d.pageCount}`}
          </Text>
        </View>
      ) : null}
      <CtaBar>
        <Button
          label="Bot한테 보내기"
          variant="secondary"
          onPress={() => router.push(botPickPath({ kind: 'file', id }))}
        />
        <Button label="지원용 프로필로 전환" onPress={() => router.push(`/docs/${id}/to-profile`)} style={styles.flex} />
      </CtaBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  bar: (w: number) => ({ width: `${w}%`, height: 6, borderRadius: 3, backgroundColor: sheet.deco, opacity: 0.55 }),
  head: { color: sheet.acText, lineHeight: LINE.head, borderBottomWidth: 1, borderBottomColor: sheet.line, paddingBottom: spacing[1], marginTop: spacing[1] },
  pages: { marginHorizontal: PAGE_INSET, marginTop: PAGE_TOP, gap: PAGE_GAP },
  firstPage: (a4: number) => ({ ...pageStyle, minHeight: a4, boxShadow: paperPage.lifted, paddingVertical: PAGE_PAD_Y, paddingHorizontal: PAGE_PAD_X, gap: spacing[2] }),
  name: { color: sheet.t1, fontSize: 22, lineHeight: LINE.name },
  contact: { color: sheet.t3, lineHeight: LINE.small },
  intro: { color: sheet.t2, fontSize: 14.5, lineHeight: LINE.intro },
  career: { gap: spacing[2], marginTop: 0 },
  careerNext: { marginTop: 2 },
  careerTitle: { color: sheet.t1, fontSize: 14.5, lineHeight: LINE.title },
  careerPeriod: { color: sheet.t3, fontSize: 14.5 },
  careerBody: { color: sheet.t2, fontSize: 13.5, lineHeight: LINE.bullet },
  small: { color: sheet.t2, lineHeight: LINE.small },
  extraPage: (a4: number) => ({ ...pageStyle, height: a4, boxShadow: paperPage.ring }),
  screen: { flex: 1, backgroundColor: theme.colors.bg2 },
  content: (inset: number) => ({ paddingTop: inset, paddingBottom: 120 }),
  empty: { marginTop: 60, textAlign: 'center' },
  counter: (bottom: number) => ({
    position: 'absolute',
    bottom: bottom + COUNTER_BOTTOM,
    alignSelf: 'center',
    height: COUNTER_HEIGHT,
    paddingHorizontal: spacing[3],
    borderRadius: COUNTER_HEIGHT / 2,
    justifyContent: 'center',
    backgroundColor: counterPill,
    zIndex: 4,
  }),
  counterLabel: { color: onAccent },
  flex: { flex: 1 },
}))

export default DocViewerScreen

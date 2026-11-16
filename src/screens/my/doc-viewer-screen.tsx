import { router } from 'expo-router'
import { ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShareFile, useStartChat } from '@/features/chat'
import {
  FIX_DOC,
  PREVIEW_HEADINGS,
  useResumeDraft,
  useFileMenu,
  useSource,
  useUndoRemove,
  type ResumeDraft,
} from '@/features/my'
import { CtaBar, Button, GlassButton, Skeleton, Text, TopBar } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { counterPill, onAccent, palette, paperPage, spacing, useColors } from '@/theme'

// DocViewer draws each page as a white A4 card 6 in from the screen edge, text at its natural size (file viewer mode, owner 2026-11-15).
const PAGE_INSET = 6
const PAGE_GAP = 10
const PAGE_PAD_X = 24
const PAGE_PAD_Y = 30
// The gate device lays the board's A4 box out at the screen width (568.3 pt at 402), not at the 390 pt card width.
const A4 = 1.414
const TITLE_MAX_WIDTH = 168
// The page counter floats over the paper, centred above the CTA bar (DocViewer: 28pt pill, 92pt over the home indicator).
const COUNTER_BOTTOM = 92
const COUNTER_HEIGHT = 28
const CAREER_BARS = [92, 70]
const PROJECT_BARS = [88, 76, 82, 60]
// The board sets 4pt under the TopBar before the first page.
const PAGE_TOP = 4

const sheet = palette.light
// The gate device's line boxes of the board's spans without a line-height (22, 13 and 14.5px text), measured on render/ios/DocViewer/1.text.json.
const LINE = { name: 33, small: 19.5, head: 20, intro: 21, title: 22, bullet: 20 }

const Bars = ({ widths }: { widths: readonly number[] }) =>
  widths.map((w) => (
    <View key={w} style={{ width: `${w}%`, height: 6, borderRadius: 3, backgroundColor: sheet.deco, opacity: 0.55 }} />
  ))

const pageStyle = { width: '100%', backgroundColor: sheet.paper, borderRadius: 3 } as const

const Paper = ({ d }: { d: ResumeDraft }) => {
  const p = d.profile
  const a4 = useWindowDimensions().width * A4
  const head = (t: string) => (
    <Text
      v="c1"
      weight="800"
      style={{ color: sheet.acText, lineHeight: LINE.head, borderBottomWidth: 1, borderBottomColor: sheet.line, paddingBottom: spacing[1], marginTop: spacing[1] }}
    >
      {t}
    </Text>
  )
  return (
    <View style={{ marginHorizontal: PAGE_INSET, marginTop: PAGE_TOP, gap: PAGE_GAP }}>
      <View
        accessibilityLabel={`${p.displayName} 서류 미리보기`}
        style={{ ...pageStyle, minHeight: a4, boxShadow: paperPage.lifted, paddingVertical: PAGE_PAD_Y, paddingHorizontal: PAGE_PAD_X, gap: spacing[2] }}
      >
        <Text v="h3" weight="800" style={{ color: sheet.t1, fontSize: 22, lineHeight: LINE.name }}>
          {p.displayName}
        </Text>
        <Text v="c1" weight="400" style={{ color: sheet.t3, lineHeight: LINE.small }}>
          {[d.email, ...d.links].filter(Boolean).join(' · ')}
        </Text>
        <Text v="b2" weight="400" style={{ color: sheet.t2, fontSize: 14.5, lineHeight: LINE.intro }}>
          {p.intro}
        </Text>
        {head(PREVIEW_HEADINGS[0])}
        {p.careers.map((cr, i) => (
          <View key={`${cr.company}-${cr.startedOn}`} style={{ gap: spacing[2], marginTop: i ? 2 : 0 }}>
            <Text v="b2" weight="700" style={{ color: sheet.t1, fontSize: 14.5, lineHeight: LINE.title }}>
              {cr.company} · {cr.role}{' '}
              <Text v="b2" weight="500" style={{ color: sheet.t3, fontSize: 14.5 }}>
                {cr.startedOn.replace('-', '.')} – {cr.endedOn?.replace('-', '.') ?? '현재'}
              </Text>
            </Text>
            {cr.description ? (
              <Text v="b2" weight="400" style={{ color: sheet.t2, fontSize: 13.5, lineHeight: LINE.bullet }}>
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
            <Text key={project} v="c1" weight="400" style={{ color: sheet.t2, lineHeight: LINE.small }}>
              {project}
            </Text>
          ))
        ) : (
          <Bars widths={PROJECT_BARS} />
        )}
        {head(PREVIEW_HEADINGS[2])}
        <Text v="c1" weight="400" style={{ color: sheet.t2, lineHeight: LINE.small }}>
          {p.skills.join(' · ')}
        </Text>
      </View>
      {Array.from({ length: Math.max((d.pageCount ?? 1) - 1, 0) }, (_, i) => (
        <View key={i} style={{ ...pageStyle, height: a4, boxShadow: paperPage.ring }} />
      ))}
    </View>
  )
}

const DocViewerScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const start = useStartChat()
  const doc = useSource(id)
  const share = useShareFile()
  const draft = useResumeDraft(id)
  useUndoRemove(() => router.back())
  const s = doc.data
  const openMenu = useFileMenu(s)
  const d = draft.data

  return (
    <View style={{ flex: 1, backgroundColor: c.bg2 }}>
      <TopBar
        left={
          <Text v="h3" numberOfLines={1} accessibilityRole="header" style={{ alignSelf: 'center', maxWidth: TITLE_MAX_WIDTH }}>
            {s ? displayName(s.fileName) : '서류 보기'}
          </Text>
        }
        onBack={() => router.back()}
        right={
          <GlassButton
            actions={[
              { icon: 'share', label: '공유', onPress: () => (s ? share.mutate({ sourceId: id, name: s.fileName, mimeType: s.mimeType }) : doc.isError && share.mutate({ documentId: id })) },
              { icon: 'more', label: '더 보기', onPress: openMenu },
            ]}
          />
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {d ? (
          <Paper d={d} />
        ) : draft.isPending ? (
          <Skeleton width="100%" height={420} radius={0} />
        ) : (
          <Text v="b2" color="t3" style={{ marginTop: 60, textAlign: 'center' }}>
            미리보기는 곧 볼 수 있어요
          </Text>
        )}
      </ScrollView>
      {d?.pageCount ? (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + COUNTER_BOTTOM,
            alignSelf: 'center',
            height: COUNTER_HEIGHT,
            paddingHorizontal: spacing[3],
            borderRadius: COUNTER_HEIGHT / 2,
            justifyContent: 'center',
            backgroundColor: counterPill,
            zIndex: 4,
          }}
        >
          <Text v="c1" weight="600" style={{ color: onAccent }}>
            {`1 / ${d.pageCount}`}
          </Text>
        </View>
      ) : null}
      <CtaBar>
        <Button
          label="Bot한테 보내기"
          variant="secondary"
          onPress={() => void start(FIX_DOC, FIX_DOC, s?.fileName, undefined, undefined, { evidenceIds: [id] })}
        />
        <Button label="지원용 프로필로 전환" onPress={() => router.push(`/docs/${id}/to-profile`)} style={{ flex: 1 }} />
      </CtaBar>
    </View>
  )
}

export default DocViewerScreen

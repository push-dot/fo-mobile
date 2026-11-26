import type { Application } from '@push/api-client'
import { monthDay } from '@push/shared'
import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { FitRing, ListSkeleton, pushCardLines, PUSH_DOCS_TITLE, useDocuments, useMyApplications } from '@/features/my'
import { Text, NativeTopBar } from '@/shared/components'
import { lineRing } from '@/theme'
import type { HubDocument } from '@/features/my'

const Line = ({ doc, application }: { doc: HubDocument; application: Application | null }) => {
  const lines = pushCardLines(doc, application)
  const sub = [lines.doc, monthDay(doc.updatedAt)].filter(Boolean).join(' · ')
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[lines.company, lines.title, lines.score && `적합도 10점 만점에 ${lines.score}점`, lines.doc, monthDay(doc.updatedAt)].filter(Boolean).join(', ')}
      onPress={() => router.push({ pathname: '/docs/push/[id]', params: { id: doc.id } })}
      style={styles.line}
    >
      <View style={styles.lineBody}>
        <View style={styles.lineHead}>
          <Text v="h3" weight="800" numberOfLines={1} style={styles.lineTitle}>
            {lines.title}
          </Text>
          {lines.company ? (
            <Text v="c1" weight="600" color="t2" numberOfLines={1}>
              {lines.company}
            </Text>
          ) : null}
        </View>
        {sub ? (
          <Text v="c1" color="t2" numberOfLines={1} style={styles.lineSub}>
            {sub}
          </Text>
        ) : null}
      </View>
      {lines.score ? <FitRing score={lines.score} /> : null}
    </Pressable>
  )
}

const PushDocsScreen = () => {
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useDocuments()
  const apps = useMyApplications().data?.data ?? []
  const docs = data?.data ?? []
  return (
    <View style={styles.screen}>
      <NativeTopBar title={PUSH_DOCS_TITLE} onBack={() => router.back()} />
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.content(insets.bottom)}>
          <Text v="c1" weight="600" color="t2" style={styles.count}>
            {data?.page.total ?? docs.length}개
          </Text>
          {docs.map((doc) => (
            <Line key={doc.id} doc={doc} application={apps.find((a) => a.id === doc.applicationId) ?? null} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    borderRadius: theme.radius.card,
    ...lineRing(theme.colors),
    paddingVertical: theme.spacing[4],
    paddingLeft: theme.spacing[5],
    paddingRight: theme.spacing[4],
  },
  lineBody: { flex: 1, minWidth: 0 },
  lineHead: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  lineTitle: { flexShrink: 1 },
  lineSub: { marginTop: theme.spacing[1] },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: (bottom: number) => ({ gap: theme.spacing[3], paddingHorizontal: theme.spacing[5], paddingBottom: bottom + theme.spacing[6] }),
  count: { paddingTop: theme.spacing[2] + 1.7, lineHeight: theme.type.b1.lineHeight, marginBottom: -1.7 },
}))

export default PushDocsScreen

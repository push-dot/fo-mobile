import { router } from 'expo-router'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { PushDocView, pushCardLines, PUSH_DOCS_TITLE, Row, useDocuments, useMyApplications } from '@/features/my'
import { Icon, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'
import type { HubDocument } from '@/features/my'

const Line = ({ doc }: { doc: HubDocument }) => {
  const apps = useMyApplications()
  const application = apps.data?.data.find((a) => a.id === doc.applicationId) ?? null
  const lines = pushCardLines(doc, application)
  return (
    <Row label={lines.title} onPress={() => router.push(`/docs/push/${doc.id}`)}>
      <View style={{ flex: 1 }}>
        {lines.company ? (
          <Text v="c1" color="t3">
            {lines.company}
          </Text>
        ) : null}
        <Text v="b1" weight="700">
          {lines.title}
        </Text>
      </View>
      <Icon name="chev" size={18} color="t4" />
    </Row>
  )
}

const PushDocsScreen = () => {
  const c = useColors()
  const { data, isLoading } = useDocuments()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={PUSH_DOCS_TITLE} onBack={() => router.back()} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView>
          {(data?.data ?? []).map((doc) => (
            <Line key={doc.id} doc={doc} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default PushDocsScreen

export const PushDocScreen = ({ id }: { id: string }) => <PushDocView id={id} />

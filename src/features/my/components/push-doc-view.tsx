import { router } from 'expo-router'
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native'
import { monthDay } from '@push/shared'
import { Button, Text, TopBar } from '@/shared/components'
import { useColors } from '../../../theme'
import { useDocument, useDocumentVersions, useMyApplications, useSetBaseProfile } from '../api/hooks'
import { useToast } from '../hooks'
import { PREVIEW_HEADINGS, pushCardLines, SET_BASE_COPY } from '../utils'
import Toast from './toast'

const PushDocView = ({ id, onClose }: { id: string; onClose?: () => void }) => {
  const c = useColors()
  const doc = useDocument(id)
  const versions = useDocumentVersions(id)
  const apps = useMyApplications()
  const toast = useToast()
  const setBase = useSetBaseProfile(() => toast.show(SET_BASE_COPY.toast))
  const item = doc.data?.data
  const application = apps.data?.data.find((a) => a.id === item?.applicationId) ?? null
  const lines = item ? pushCardLines(item, application) : null
  const body = (versions.data?.data[0]?.blocks ?? []).map((block) => block.text).filter(Boolean)
  const ask = () =>
    Alert.alert(SET_BASE_COPY.title, SET_BASE_COPY.body, [
      { text: SET_BASE_COPY.cancel, style: 'cancel' },
      { text: SET_BASE_COPY.confirm, onPress: () => setBase.mutate(id) },
    ])

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="지원 서류용 프로필" onBack={onClose ?? (() => router.back())} />
      {doc.isLoading || !item || !lines ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}>
          <Text v="c1" color="t3">
            {lines.company}
          </Text>
          <Text v="h2">{lines.title}</Text>
          {application?.appliedAt ? (
            <Text v="c1" color="t3">
              {monthDay(application.appliedAt)}
            </Text>
          ) : null}
          {lines.score ? <Text v="h3">{lines.score}</Text> : null}
          {application ? (
            <Button
              label="공고 보기"
              variant="secondary"
              size="sm"
              onPress={() => router.push(`/postings/${application.jobId}`)}
            />
          ) : null}
          {body.map((text) => (
            <Text key={text} v="b2" color="t2">
              {text}
            </Text>
          ))}
          <Text v="h3">{PREVIEW_HEADINGS[1]}</Text>
          <Button
            label={setBase.isPending ? '설정하는 중' : SET_BASE_COPY.action}
            disabled={setBase.isPending}
            onPress={ask}
          />
        </ScrollView>
      )}
      <Toast text={toast.text} action={toast.action} onHide={toast.hide} />
    </View>
  )
}

export default PushDocView

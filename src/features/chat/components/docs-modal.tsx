import { router } from 'expo-router'
import { View } from 'react-native'
import { deleteDocCopy, useRemoveSource } from '@/features/my'
import { Button, GlassButton, Icon, Menu, Text, askConfirm } from '@/shared/components'
import { spacing } from '../../../theme'
import { type ChatDoc } from '../api/schemas'
import { useChatDocs, useUploadChatDoc } from '../api/hooks'
import { useLeaveSidebar } from '../hooks'
import Note from './note'
import PageModal, { PageEmpty } from './page-modal'
import { docAiSub } from '../constants'
import { ago } from '../utils'

const size = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)}MB` : `${Math.round(b / 1000)}KB`)
const meta = (d: ChatDoc) => (d.aiMade ? docAiSub(ago(d.createdAt)) : `${size(d.size)} · ${ago(d.createdAt)}`)

/** 내 서류 modal (ChatDocs): same list as 마이 › 서류, + uploads. */
export const DocsModal = () => {
  const docs = useChatDocs()
  const upload = useUploadChatDoc()
  const remove = useRemoveSource(() => {})
  const leave = useLeaveSidebar()
  const ask = (d: ChatDoc) => {
    const copy = deleteDocCopy(d.fileName)
    askConfirm({ ...copy, danger: true, onConfirm: () => remove.mutate(d.id) })
  }
  const empty = !!docs.data && docs.data.length === 0
  return (
    <PageModal title="내 서류" right={<GlassButton actions={[{ icon: 'plus', label: '서류 올리기', onPress: () => upload.mutate() }]} />}>
      {empty ? (
        <PageEmpty>
          <Text v="b1" weight="700" color="t2">
            아직 등록한 서류가 없어요.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
            <Button label="파일 등록" size="pill" variant="secondary" onPress={() => upload.mutate()} />
            <Button label="에이전트로 만들기" size="pill" variant="secondary" onPress={() => leave(() => router.dismissTo('/chat'))} />
          </View>
        </PageEmpty>
      ) : null}
      {docs.data?.length ? (
        <View>
          {docs.data.map((d) => (
            <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: spacing[5] }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text v="b1" weight="700" numberOfLines={1}>
                  {d.fileName}
                </Text>
                <Text v="c1" color="t3">
                  {meta(d)}
                </Text>
              </View>
              <Menu
                accessibilityLabel={`${d.fileName} 더 보기`}
                actions={[
                  { key: 'view', label: '서류 보기', onPress: () => leave(() => router.push(`/docs/${d.id}`)) },
                  { key: 'delete', label: '서류 삭제하기', destructive: true, onPress: () => ask(d) },
                ]}
              >
                <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="menu" size={20} color="t3" />
                </View>
              </Menu>
            </View>
          ))}
        </View>
      ) : null}
      {docs.isError ? (
        <Text v="b2" color="t3" style={{ padding: spacing[6], textAlign: 'center' }}>
          서류를 불러오지 못했어요
        </Text>
      ) : null}
      {empty ? null : <Note>PDF, DOCX 파일을 20MB까지 올릴 수 있어요. 마이 › 서류와 같은 목록이에요.</Note>}
    </PageModal>
  )
}

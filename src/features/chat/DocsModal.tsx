import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import { Alert, Pressable, Share, View } from 'react-native'
import { GlassButton, Icon, Text } from '../../ui'
import { chatApi, type ChatDoc } from './api'
import { FileTag } from './Items'
import { ago, Note, PageModal } from './parts'

const size = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)}MB` : `${Math.round(b / 1000)}KB`)
const meta = (d: ChatDoc) => (d.aiMade ? `AI로 만듦 · ${ago(d.createdAt)}` : `${size(d.size)} · ${ago(d.createdAt)}`)

/** 내 서류 modal (ChatDocs): same list as 마이 › 서류, + uploads. */
export function DocsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const docs = useQuery({ queryKey: ['chat', 'docs'], queryFn: chatApi.docs, enabled: visible })
  const upload = useMutation({
    mutationFn: async () => {
      const r = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        // The upload reads the file from the app cache.
        copyToCacheDirectory: true,
      })
      const f = r.canceled ? null : r.assets[0]
      if (!f) return
      if ((f.size ?? 0) > 20_000_000) throw new Error('too big')
      await chatApi.addDoc(f)
    },
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['chat', 'docs'] }), qc.invalidateQueries({ queryKey: ['me', 'sources'] })]),
    onError: (e) => Alert.alert('올리지 못했어요', e.message === 'too big' ? '20MB까지 올릴 수 있어요.' : '잠시 뒤에 다시 해 주세요.'),
  })
  return (
    <PageModal visible={visible} onClose={onClose} title="내 서류" right={<GlassButton actions={[{ icon: 'plus', label: '서류 올리기', onPress: () => upload.mutate() }]} />}>
      {docs.data?.map((d) => (
        <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 20 }}>
          <FileTag tag={d.fileName.split('.').pop()!.toUpperCase()} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text v="b1" weight="700" numberOfLines={1}>
              {d.fileName}
            </Text>
            <Text v="c1" color="t3">
              {meta(d)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${d.fileName} 공유`}
            onPress={() => void Share.share({ message: d.fileName })}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="share" size={20} color="t3" />
          </Pressable>
        </View>
      ))}
      {docs.isError ? (
        <Text v="b2" color="t3" style={{ padding: 24, textAlign: 'center' }}>
          서류를 불러오지 못했어요
        </Text>
      ) : null}
      <Note>PDF, DOCX 파일을 20MB까지 올릴 수 있어요. 마이 › 서류와 같은 목록이에요.</Note>
    </PageModal>
  )
}

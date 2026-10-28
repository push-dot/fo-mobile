import { router } from 'expo-router'
import { Alert } from 'react-native'
import { BottomSheet, Button } from '@/shared/components'
import { useRemoveSource } from '../api/hooks'
import type { MySource } from '../types'

const DocMenu = ({
  doc,
  onClose,
  onDeleted,
  viewing,
}: {
  doc: Pick<MySource, 'id' | 'fileName'> | null
  onClose: () => void
  onDeleted?: () => void
  viewing?: boolean
}) => {
  const remove = useRemoveSource(() => {
    onClose()
    onDeleted?.()
  })
  return (
    <BottomSheet visible={!!doc} onClose={onClose} title={doc?.fileName}>
      {viewing ? null : (
        <Button
          label="서류 보기"
          variant="secondary"
          onPress={() => {
            onClose()
            router.push(`/docs/${doc!.id}`)
          }}
        />
      )}
      <Button
        label={remove.isPending ? '삭제하는 중' : '서류 삭제하기'}
        variant="secondary"
        disabled={remove.isPending}
        onPress={() =>
          Alert.alert('이 서류를 삭제할까요?', '삭제하면 되돌릴 수 없어요.', [
            { text: '취소', style: 'cancel' },
            { text: '삭제하기', style: 'destructive', onPress: () => remove.mutate(doc!.id) },
          ])
        }
      />
    </BottomSheet>
  )
}

export default DocMenu

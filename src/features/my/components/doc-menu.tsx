import { router } from 'expo-router'
import { BottomSheet, Button } from '@/shared/components'
import type { MySource } from '../types'

const DocMenu = ({
  doc,
  onClose,
  onDelete,
  viewing,
}: {
  doc: Pick<MySource, 'id' | 'fileName'> | null
  onClose: () => void
  onDelete: () => void
  viewing?: boolean
}) => {
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
        label="서류 삭제하기"
        variant="secondary"
        onPress={() => {
          onClose()
          onDelete()
        }}
      />
    </BottomSheet>
  )
}

export default DocMenu

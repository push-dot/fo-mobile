import { router } from 'expo-router'
import { useState } from 'react'
import { Sheet, TextField } from '@/shared/components'
import { useConversationList, useRenameConversation } from '../api/hooks'

export const RenameSheet = ({ id }: { id: string }) => {
  const conv = useConversationList().data?.data.find((x) => x.id === id)
  const [title, setTitle] = useState<string>()
  const value = title ?? conv?.title ?? ''
  const rename = useRenameConversation(id, conv?.revision)
  return (
    <Sheet
      title="대화 이름을 바꿀까요?"
      action={{ label: '이름 바꾸기', disabled: !value.trim() || !conv || rename.isPending, onPress: () => rename.mutate(value.trim(), { onSuccess: () => router.back() }) }}
    >
      <TextField value={value} onChangeText={setTitle} max={300} autoFocus accessibilityLabel="대화 이름" />
    </Sheet>
  )
}

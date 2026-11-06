import { router } from 'expo-router'
import { useState } from 'react'
import { Sheet, Text, TextField } from '@/shared/components'
import { useConversation, useRenameConversation } from '../api/hooks'

export const RenameSheet = ({ id }: { id: string }) => {
  const { data: conv, failed, loading, retry } = useConversation(id)
  const [title, setTitle] = useState<string>()
  const value = title ?? conv?.title ?? ''
  const rename = useRenameConversation(id, conv?.revision)
  if (failed)
    return (
      <Sheet title="대화 이름을 바꿀까요?" action={{ label: '다시 시도', disabled: loading, onPress: retry }}>
        <Text v="b2" color="t3">
          대화를 불러오지 못했어요.
        </Text>
      </Sheet>
    )
  return (
    <Sheet
      title="대화 이름을 바꿀까요?"
      action={{ label: '이름 바꾸기', disabled: !value.trim() || !conv || rename.isPending, onPress: () => rename.mutate(value.trim(), { onSuccess: () => router.back() }) }}
    >
      <TextField value={value} onChangeText={setTitle} max={300} autoFocus accessibilityLabel="대화 이름" />
    </Sheet>
  )
}

import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { requestMaterialFile, submitMaterialText } from '@/features/chat'
import { Sheet, Text, TextField } from '@/shared/components'

const MaterialsScreen = () => {
  const [kind, setKind] = useState<'github' | 'posting' | null>(null)
  const [text, setText] = useState('')
  const submit = () => {
    const value = text.trim()
    if (!value) return
    submitMaterialText(value)
    router.back()
  }
  return (
    <Sheet title="자료 고르기" action={kind ? { label: '넣기', onPress: submit, disabled: !text.trim() } : undefined}>
      {kind ? (
        <TextField
          value={text}
          onChangeText={setText}
          placeholder={kind === 'github' ? 'https://github.com/' : 'https://'}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          autoFocus
          onSubmitEditing={submit}
          accessibilityLabel={kind === 'github' ? 'GitHub 링크' : '공고 링크'}
        />
      ) : (
        <>
          <Text v="c1" weight="700" color="t3">
            다른 곳에서
          </Text>
          {(
            [
              ['파일', () => (requestMaterialFile(), router.back())],
              ['GitHub 링크', () => setKind('github')],
              ['공고 붙여넣기', () => setKind('posting')],
            ] as const
          ).map(([label, onPress]) => (
            <Pressable key={label} accessibilityRole="button" onPress={onPress} style={{ minHeight: 48, justifyContent: 'center' }}>
              <Text v="b1">{label}</Text>
            </Pressable>
          ))}
        </>
      )}
    </Sheet>
  )
}

export default MaterialsScreen

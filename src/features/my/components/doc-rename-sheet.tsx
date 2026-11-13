import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button, Icon, Sheet, showToast, Text, TextField } from '@/shared/components'
import { hitSlopTo, spacing, useColors } from '@/theme'
import { useDocument, useRenameDocument, useRenameSource, useSource } from '../api/hooks'
import { DOC_RENAME_COPY, DOC_TITLE_MAX, renamedTitle, savedLength, SOURCE_NAME_MAX, titleOver, typedTitle } from '../utils'

const CLEAR_SIZE = 24
const CLEAR_ICON = 12

/** Android's 이름 바꾸기. `source`: the id is an uploaded file's, not a Push 서류's. */
const DocRenameSheet = ({ id, source }: { id: string; source?: boolean }) => {
  const c = useColors()
  const doc = useDocument(source ? '' : id).data?.data
  const upload = useSource(source ? id : '').data
  const current = source ? upload?.fileName : doc?.title
  const max = source ? SOURCE_NAME_MAX : DOC_TITLE_MAX
  const [typed, setTyped] = useState<string>()
  const value = typed ?? current ?? ''
  const renameDoc = useRenameDocument(doc)
  const renameSource = useRenameSource(source ? id : undefined)
  const rename = source ? renameSource : renameDoc
  const over = titleOver(value, max)
  const save = () => {
    if (current === undefined || rename.isPending || over) return
    const next = renamedTitle(current, value)
    if (!next) return router.back()
    rename.mutate(next, {
      onSuccess: () => router.back(),
      onError: () => showToast({ message: DOC_RENAME_COPY.failed, alert: true, opaque: true }),
    })
  }
  return (
    <Sheet gap={spacing[2]}>
      <Text v="h3" accessibilityRole="header" style={{ paddingTop: spacing[1] }}>
        {source ? DOC_RENAME_COPY.fileTitle : DOC_RENAME_COPY.title}
      </Text>
      <Text v="b2" color="t2">
        {DOC_RENAME_COPY.description}
      </Text>
      <View style={{ marginTop: spacing[2] }}>
        <TextField
          value={value}
          onChangeText={(t) => setTyped(typedTitle(value, t, max))}
          placeholder={DOC_RENAME_COPY.placeholder}
          autoFocus
          focusRing
          returnKeyType="done"
          onSubmitEditing={save}
          accessibilityLabel={DOC_RENAME_COPY.field}
          trailing={
            value ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={DOC_RENAME_COPY.clear}
                hitSlop={hitSlopTo(CLEAR_SIZE, CLEAR_SIZE)}
                onPress={() => setTyped('')}
                style={{ width: CLEAR_SIZE, height: CLEAR_SIZE, borderRadius: CLEAR_SIZE / 2, backgroundColor: c.t4, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={CLEAR_ICON} color="bg" />
              </Pressable>
            ) : null
          }
        />
      </View>
      <Text v="c1" color={over ? 'red' : 't3'} style={{ alignSelf: 'flex-end', paddingRight: spacing[1] }}>
        {savedLength(value)}/{max}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] }}>
        <Button label={DOC_RENAME_COPY.cancel} variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
        <Button label={DOC_RENAME_COPY.save} disabled={current === undefined || !value.trim() || over || rename.isPending} onPress={save} style={{ flex: 1 }} />
      </View>
    </Sheet>
  )
}

export default DocRenameSheet

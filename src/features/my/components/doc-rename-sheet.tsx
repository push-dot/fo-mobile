import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { Icon, Sheet, showToast, Text, TextField } from '@/shared/components'
import { displayName, extensionOf } from '@/shared/utility/display-name'
import { hitSlopTo, spacing, useColors } from '@/theme'
import { useDocument, useRenameDocument, useRenameSource, useSource } from '../api/hooks'
import { DOC_RENAME_COPY, DOC_TITLE_MAX, renamedTitle, savedLength, titleOver, typedTitle } from '../utils'

const CLEAR_SIZE = 24
const CLEAR_ICON = 18
// The board's sheet starts 4 higher on the title (centre 43 under the top, not 47) and ends 38 under the CTA, not 26: the floating sheet sits at 866 on both, so the top lands 8 higher.
const RENAME_TITLE_LIFT = -4
const RENAME_BOTTOM_EXTRA = 12

const DocRenameSheet = ({ id, source }: { id: string; source?: boolean }) => {
  const c = useColors()
  const doc = useDocument(source ? '' : id).data?.data
  const upload = useSource(source ? id : '').data
  const current = source ? (upload ? displayName(upload.fileName) : undefined) : doc?.title
  const [typed, setTyped] = useState<string>()
  const value = typed ?? current ?? ''
  const renameDoc = useRenameDocument(doc)
  const renameSource = useRenameSource(source ? id : undefined)
  const rename = source ? renameSource : renameDoc
  const over = titleOver(value)
  const save = () => {
    if (current === undefined || rename.isPending || over) return
    const next = renamedTitle(current, value)
    if (!next) return router.back()
    rename.mutate(source && upload ? `${next}${extensionOf(upload.fileName)}` : next, {
      onSuccess: () => router.back(),
      onError: () => showToast({ message: DOC_RENAME_COPY.failed, alert: true }),
    })
  }
  return (
    <Sheet gap={spacing[1]} actionGap={10} slimAction bottomExtra={RENAME_BOTTOM_EXTRA} action={{ label: DOC_RENAME_COPY.save, onPress: save, disabled: current === undefined || !value.trim() || over || rename.isPending }}>
      <View style={{ minHeight: 52, justifyContent: 'center', marginTop: Platform.OS === 'ios' ? RENAME_TITLE_LIFT : 0 }}>
        <Text v="h3" weight="600" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {source ? DOC_RENAME_COPY.fileTitle : DOC_RENAME_COPY.title}
        </Text>
      </View>
      <View style={{ paddingHorizontal: spacing[1], gap: 6 }}>
        <Text v="b2" color="t2">
          {DOC_RENAME_COPY.description}
        </Text>
        <View style={{ marginTop: spacing[1] }}>
          <TextField
            value={value}
            onChangeText={(t) => setTyped(typedTitle(value, t))}
            placeholder={DOC_RENAME_COPY.placeholder}
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
                  style={{ width: CLEAR_SIZE, height: CLEAR_SIZE, borderRadius: CLEAR_SIZE / 2, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="x" size={CLEAR_ICON} color="t3" />
                </Pressable>
              ) : null
            }
          />
        </View>
        <Text v="c1" color={over ? 'red' : 't3'} style={{ alignSelf: 'flex-end', paddingTop: 2, paddingRight: spacing[1] }}>
          {savedLength(value)}/{DOC_TITLE_MAX}
        </Text>
      </View>
    </Sheet>
  )
}

export default DocRenameSheet

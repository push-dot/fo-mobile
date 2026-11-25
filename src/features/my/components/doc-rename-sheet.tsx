import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon, Sheet, showToast, Text, TextField } from '@/shared/components'
import { displayName, extensionOf } from '@/shared/utility/display-name'
import { hitSlopTo, spacing } from '@/theme'
import { useDocument, useRenameDocument, useRenameSource, useSource } from '../api/hooks'
import { DOC_RENAME_COPY, DOC_TITLE_MAX, renamedTitle, savedLength, titleOver, typedTitle } from '../utils'

const CLEAR_SIZE = 24
const CLEAR_ICON = 18
const RENAME_TITLE_LIFT = -4
const RENAME_BOTTOM_EXTRA = 12

const DocRenameSheet = ({ id, source }: { id: string; source?: boolean }) => {
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
      <View style={styles.titleRow}>
        <Text v="h3" weight="600" accessibilityRole="header" style={styles.title}>
          {source ? DOC_RENAME_COPY.fileTitle : DOC_RENAME_COPY.title}
        </Text>
      </View>
      <View style={styles.body}>
        <Text v="b2" color="t2">
          {DOC_RENAME_COPY.description}
        </Text>
        <View style={styles.field}>
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
                  style={styles.clear}
                >
                  <Icon name="x" size={CLEAR_ICON} color="t3" />
                </Pressable>
              ) : null
            }
          />
        </View>
        <Text v="c1" color={over ? 'red' : 't3'} style={styles.count}>
          {savedLength(value)}/{DOC_TITLE_MAX}
        </Text>
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  titleRow: { minHeight: 52, justifyContent: 'center', marginTop: Platform.OS === 'ios' ? RENAME_TITLE_LIFT : 0 },
  title: { textAlign: 'center' },
  body: { paddingHorizontal: theme.spacing[1], gap: 6 },
  field: { marginTop: theme.spacing[1] },
  clear: { width: CLEAR_SIZE, height: CLEAR_SIZE, borderRadius: CLEAR_SIZE / 2, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' },
  count: { alignSelf: 'flex-end', paddingTop: 2, paddingRight: theme.spacing[1] },
}))

export default DocRenameSheet

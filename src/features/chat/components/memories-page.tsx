import type { UserMemory } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { askConfirm, Button, emptyNoteStyle, GlassButton, SettingsGroup, StatusNote, Text, TextField } from '@/shared/components'
import { useClearMemories, useMemories, useRemoveMemory, useUpdateMemory } from '@/features/my'
import { ago } from '../utils/ago'
import { MEMORIES_COPY, MEMORY_MAX, memoryDraft } from '../utils/memories'
import Note from './note'
import PageModal from './page-modal'

const back = [{ icon: 'back', label: '뒤로', onPress: () => router.back() }] as const

const MemoryEditor = ({ memory, onDone }: { memory: UserMemory; onDone: () => void }) => {
  const [text, setText] = useState(memory.text)
  const update = useUpdateMemory()
  const remove = useRemoveMemory()
  const next = memoryDraft(text, memory.text)
  const save = () => {
    if (!next) return
    update.mutate({ id: memory.id, text: next })
    onDone()
  }
  const drop = () => {
    remove.mutate(memory.id)
    onDone()
  }
  return (
    <View style={styles.editor}>
      <TextField value={text} onChangeText={setText} multiline max={MEMORY_MAX} autoFocus accessibilityLabel={MEMORIES_COPY.title} />
      <View style={styles.actions}>
        <Button label={MEMORIES_COPY.remove} size="sm" variant="secondary" onPress={drop} style={styles.remove} />
        <Button label={MEMORIES_COPY.cancel} size="sm" variant="secondary" onPress={onDone} />
        <Button label={MEMORIES_COPY.save} size="sm" onPress={save} disabled={!next} />
      </View>
    </View>
  )
}

const MemoriesPage = () => {
  const { data, isPending, refetch } = useMemories()
  const clear = useClearMemories()
  const [editing, setEditing] = useState<string | null>(null)
  const clearAll = () =>
    askConfirm({
      title: MEMORIES_COPY.clearTitle,
      body: MEMORIES_COPY.clearBody,
      confirm: MEMORIES_COPY.clear,
      danger: true,
      onConfirm: () => {
        setEditing(null)
        clear.mutate()
      },
    })
  return (
    <PageModal title={MEMORIES_COPY.title} tight page nav left={<GlassButton actions={[...back]} />}>
      {isPending ? (
        <ActivityIndicator style={styles.spinner} />
      ) : !data ? (
        <StatusNote lines={[MEMORIES_COPY.failed]} action={{ label: MEMORIES_COPY.retry, onPress: () => void refetch() }} style={emptyNoteStyle(140, false)} />
      ) : data.length === 0 ? (
        <StatusNote lines={[MEMORIES_COPY.emptyTitle, MEMORIES_COPY.emptyBody]} style={emptyNoteStyle(140, false)} />
      ) : (
        <>
          <Note style={styles.intro}>{MEMORIES_COPY.intro}</Note>
          <View style={styles.group}>
            <SettingsGroup note={MEMORIES_COPY.editHint}>
              {data.map((m) =>
                editing === m.id ? (
                  <MemoryEditor key={m.id} memory={m} onDone={() => setEditing(null)} />
                ) : (
                  <Pressable key={m.id} accessibilityRole="button" accessibilityHint={MEMORIES_COPY.editHint} onPress={() => setEditing(m.id)} style={styles.row}>
                    <Text v="b1">{m.text}</Text>
                    <Text v="c1" color="t3">
                      {ago(m.updatedAt)}
                    </Text>
                  </Pressable>
                ),
              )}
            </SettingsGroup>
          </View>
          <View style={styles.action}>
            <Button label={MEMORIES_COPY.clear} variant="secondary" onPress={clearAll} disabled={clear.isPending} />
          </View>
        </>
      )}
    </PageModal>
  )
}

const styles = StyleSheet.create((theme) => ({
  spinner: { marginTop: theme.spacing[6] },
  intro: { paddingTop: theme.spacing[2], paddingBottom: theme.spacing[3] },
  group: { paddingHorizontal: theme.spacing[5] },
  row: { minHeight: 56, paddingVertical: theme.spacing[3], gap: theme.spacing[1], justifyContent: 'center' },
  editor: { paddingVertical: theme.spacing[3], gap: theme.spacing[2] },
  actions: { flexDirection: 'row', gap: theme.spacing[2] },
  remove: { marginRight: 'auto' },
  action: { paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4] },
}))

export default MemoriesPage

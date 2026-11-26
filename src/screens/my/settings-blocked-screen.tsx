import type { BlockedUser } from '@push/api-client'
import { router } from 'expo-router'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Avatar, BLOCKED_COPY, blockedLine, OFFER_MENU_COPY, RETRY_LABEL, useBlocked, useUnblock } from '@/features/my'
import { Button, emptyNoteStyle, SettingsGroup, NativeTopBar, StatusNote, Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { HIT_TARGET } from '@/theme'

const UNBLOCK_HEIGHT = 36

const BlockedRow = ({ b }: { b: BlockedUser }) => {
  const unblock = useUnblock()
  return (
    <View style={styles.row}>
      <Avatar name={b.user.displayName} size={44} />
      <View style={styles.rowText}>
        <Text v="b1" numberOfLines={1}>
          {b.user.displayName}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {blockedLine(b)}
        </Text>
      </View>
      <Button
        label={BLOCKED_COPY.unblock}
        size="sm"
        weight="600"
        disabled={unblock.isPending}
        style={styles.unblock}
        onPress={() => unblock.mutate(b.user.id)}
      />
    </View>
  )
}

const SettingsBlockedScreen = () => {
  const { data, isPending, refetch } = useBlocked()
  const rows = data?.data
  return (
    <View style={styles.screen}>
      <NativeTopBar title={BLOCKED_COPY.title} onBack={() => router.back()} />
      {isPending ? (
        <ActivityIndicator style={styles.spinner} />
      ) : !rows ? (
        <StatusNote lines={[OFFER_MENU_COPY.failed]} action={{ label: RETRY_LABEL, onPress: () => void refetch() }} style={emptyNoteStyle(140, false)} />
      ) : rows.length === 0 ? (
        <StatusNote lines={[BLOCKED_COPY.empty]} style={emptyNoteStyle(140, false)} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text v="b2" color="t3" style={styles.intro}>
            {BLOCKED_COPY.intro}
          </Text>
          <SettingsGroup note={BLOCKED_COPY.note}>
            {rows.map((b) => (
              <BlockedRow key={b.user.id} b={b} />
            ))}
          </SettingsGroup>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  spinner: { marginTop: theme.spacing[6] },
  content: { paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[5], paddingBottom: HIT_TARGET },
  intro: { paddingHorizontal: theme.spacing[1], paddingBottom: theme.spacing[4] },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  rowText: { flex: 1, minWidth: 0 },
  unblock: { height: UNBLOCK_HEIGHT, minHeight: UNBLOCK_HEIGHT, borderRadius: UNBLOCK_HEIGHT / 2, alignSelf: 'center', flexShrink: 0 },
}))

export default SettingsBlockedScreen

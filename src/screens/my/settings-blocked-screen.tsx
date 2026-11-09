import { router } from 'expo-router'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Avatar, BLOCKED_COPY, blockedLine, OFFER_MENU_COPY, RETRY_LABEL, useBlocked, useUnblock } from '@/features/my'
import { Button, emptyNoteStyle, SettingsGroup, StatusNote, Text, TopBar } from '@/shared/components'
import { HIT_TARGET, spacing, useColors } from '@/theme'

const SettingsBlockedScreen = () => {
  const c = useColors()
  const { data, isPending, refetch } = useBlocked()
  const unblock = useUnblock()
  const rows = data?.data
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={BLOCKED_COPY.title} onBack={() => router.back()} />
      {isPending ? (
        <ActivityIndicator style={{ marginTop: spacing[6] }} />
      ) : !rows ? (
        <StatusNote lines={[OFFER_MENU_COPY.failed]} action={{ label: RETRY_LABEL, onPress: () => void refetch() }} style={emptyNoteStyle(140)} />
      ) : rows.length === 0 ? (
        <StatusNote lines={[BLOCKED_COPY.empty]} style={emptyNoteStyle(140)} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: spacing[1], paddingHorizontal: spacing[5], paddingBottom: HIT_TARGET }}>
          <Text v="b2" color="t3" style={{ paddingHorizontal: spacing[1], paddingBottom: spacing[4] }}>
            {BLOCKED_COPY.intro}
          </Text>
          <SettingsGroup note={BLOCKED_COPY.note}>
            {rows.map((b) => (
              <View key={b.user.id} style={{ minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Avatar name={b.user.displayName} size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text v="b1" numberOfLines={1}>
                    {b.user.displayName}
                  </Text>
                  <Text v="c1" color="t3" numberOfLines={1}>
                    {blockedLine(b)}
                  </Text>
                </View>
                <Button
                  label={BLOCKED_COPY.unblock}
                  variant="secondary"
                  size="sm"
                  disabled={unblock.isPending && unblock.variables === b.user.id}
                  style={{ minHeight: 36, borderRadius: 18 }}
                  onPress={() => unblock.mutate(b.user.id)}
                />
              </View>
            ))}
          </SettingsGroup>
        </ScrollView>
      )}
    </View>
  )
}

export default SettingsBlockedScreen

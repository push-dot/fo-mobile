import { Pressable, View } from 'react-native'
import { useBots, type Bot } from '@/features/bots'
import { Icon, Mascot, Text } from '@/shared/components'
import { radius, spacing } from '@/theme'
import { useMaterialDetail } from '../api/hooks'
import { SEND_PICK_HINT } from '../constants'
import type { MaterialKind } from '../types'
import { toAttachment } from '../utils/material-row'
import { MaterialPage } from './material-page'
import { sendToBot } from './send-material'

const PickRow = ({ bot, onPress }: { bot: Bot; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={bot.name}
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: 10, paddingHorizontal: spacing[2], borderRadius: radius.md }}
  >
    <Mascot size={40} state="idle" color={bot.kind === 'push' ? 'push' : bot.color} />
    <Text v="b1" weight="700" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
      {bot.name}
    </Text>
    <Icon name="chev" size={18} color="t3" />
  </Pressable>
)

export const SendBotPage = ({ kind, id }: { kind: MaterialKind; id: string }) => {
  const material = useMaterialDetail(kind, id).data?.material
  const bots = useBots().data ?? []
  const attachment = material ? toAttachment(material) : null
  return (
    <MaterialPage title={SEND_PICK_HINT}>
      <View style={{ paddingHorizontal: spacing[3], gap: spacing[2] }}>
        {attachment ? (
          <Text v="b2" color="t3" style={{ paddingHorizontal: spacing[2] }}>
            {attachment.title}
          </Text>
        ) : null}
        {attachment ? bots.map((bot) => <PickRow key={bot.id} bot={bot} onPress={() => sendToBot(bot, attachment)} />) : null}
      </View>
    </MaterialPage>
  )
}

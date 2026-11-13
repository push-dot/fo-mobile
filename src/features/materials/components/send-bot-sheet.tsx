import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useBots, type Bot } from '@/features/bots'
import { GlassButton, Icon, Mascot, Sheet, Text } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'
import { useMaterialDetail } from '../api/hooks'
import { SEND_PICK_TITLE } from '../constants'
import type { MaterialKind } from '../types'
import { toAttachment } from '../utils/material-row'
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

/** BotPick: 보내기 from the bot home asks which bot gets the material. */
export const SendBotSheet = ({ kind, id }: { kind: MaterialKind; id: string }) => {
  const c = useColors()
  const material = useMaterialDetail(kind, id).data?.material
  const bots = useBots().data ?? []
  const attachment = material ? toAttachment(material) : null
  return (
    <Sheet gap={10}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, minWidth: 0, paddingHorizontal: spacing[1] }}>
          {SEND_PICK_TITLE}
        </Text>
        <GlassButton circle iconSize={18} actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
      </View>
      {attachment ? (
        <View style={{ alignSelf: 'flex-start', maxWidth: 270, padding: 6, borderRadius: 14, backgroundColor: c.bg2 }}>
          <Text v="c1" weight="600" numberOfLines={1}>
            {attachment.title}
          </Text>
        </View>
      ) : null}
      <View>
        {attachment ? bots.map((bot) => <PickRow key={bot.id} bot={bot} onPress={() => sendToBot(bot, attachment)} />) : null}
      </View>
    </Sheet>
  )
}

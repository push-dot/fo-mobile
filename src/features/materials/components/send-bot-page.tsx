import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useBots, type Bot } from '@/features/bots'
import { PageModal } from '@/features/chat'
import { GlassButton, Icon, Mascot, Text } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'
import { useMaterialDetail } from '../api/hooks'
import { SEND_PICK_HINT, SEND_PICK_TITLE } from '../constants'
import type { MaterialKind } from '../types'
import { toAttachment } from '../utils/material-row'
import { useInMaterialsModal } from './in-materials-modal'
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

/** BotPick: 보내기 from the bot home asks which bot gets the material, on a page inside the 자료 modal. */
export const SendBotPage = ({ kind, id }: { kind: MaterialKind; id: string }) => {
  const c = useColors()
  const material = useMaterialDetail(kind, id).data?.material
  const bots = useBots().data ?? []
  const attachment = material ? toAttachment(material) : null
  return (
    <PageModal
      title={SEND_PICK_TITLE}
      left={<GlassButton circle iconSize={20} actions={[{ icon: 'back', label: '뒤로', onPress: () => router.back() }]} />}
      page={!useInMaterialsModal()}
    >
      <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[3], gap: 10 }}>
        <Text v="b2" color="t3">
          {SEND_PICK_HINT}
        </Text>
        {attachment ? (
          <View style={{ alignSelf: 'flex-start', maxWidth: 270, padding: 6, borderRadius: 14, backgroundColor: c.bg2 }}>
            <Text v="c1" weight="600" numberOfLines={1}>
              {attachment.title}
            </Text>
          </View>
        ) : null}
        <View>{attachment ? bots.map((bot) => <PickRow key={bot.id} bot={bot} onPress={() => sendToBot(bot, attachment)} />) : null}</View>
      </View>
    </PageModal>
  )
}

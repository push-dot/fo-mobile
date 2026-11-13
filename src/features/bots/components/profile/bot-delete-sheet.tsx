import { Button, Mascot, Text } from '@/shared/components'
import { View } from 'react-native'
import { spacing } from '../../../../theme'
import type { CompanyBot } from '../../types'
import { SheetCard } from './sheet-card'
import { CANCEL_LABEL, DELETE_ACTION, DELETE_BODY, deleteTitle } from './profile-rows'

const DELETE_MASCOT = 40

const BotDeleteSheet = ({ bot, disabled, onClose, onDelete }: { bot: CompanyBot; disabled: boolean; onClose: () => void; onDelete: () => void }) => (
  <SheetCard label={deleteTitle(bot.name)} onClose={onClose}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingTop: spacing[1],
      }}
    >
      <Mascot size={DELETE_MASCOT} color={bot.color} motion={{ mode: 'still' }} />
      <Text v="h3" accessibilityRole="header" style={{ flex: 1 }}>
        {deleteTitle(bot.name)}
      </Text>
    </View>
    <Text v="b2" color="t2">
      {DELETE_BODY}
    </Text>
    <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
      <Button label={CANCEL_LABEL} variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button label={DELETE_ACTION} variant="danger" disabled={disabled} onPress={onDelete} style={{ flex: 1 }} />
    </View>
  </SheetCard>
)

export default BotDeleteSheet

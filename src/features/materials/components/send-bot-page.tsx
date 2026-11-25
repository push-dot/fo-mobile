import { useMaterialDetail } from '../api/hooks'
import { SEND_PICK_HINT } from '../constants'
import type { MaterialKind } from '../types'
import { toAttachment } from '../utils/material-row'
import BotPickSheet from './bot-pick-sheet'
import { sendToBot } from './send-material'

const SendBotPage = ({ kind, id }: { kind: MaterialKind; id: string }) => {
  const material = useMaterialDetail(kind, id).data?.material
  const attachment = material ? toAttachment(material) : null
  return <BotPickSheet title={SEND_PICK_HINT} subtitle={attachment?.title} onPick={attachment ? (bot) => sendToBot(bot, attachment) : null} />
}

export default SendBotPage

import type { Offer } from '@push/api-client'
import type { OfferPerson } from '../types'

type Box = 'received' | 'sent'

export const counterpart = (o: Offer, box: Box): OfferPerson =>
  box === 'received' ? o.sender : o.recipient

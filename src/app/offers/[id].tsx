import { useLocalSearchParams } from 'expo-router'
import { OfferDetailScreen } from '../../features/my/OfferDetailScreen'

export default function Route() {
  const { id, box } = useLocalSearchParams<{ id: string; box?: 'received' | 'sent' }>()
  return <OfferDetailScreen id={id} box={box === 'sent' ? 'sent' : 'received'} />
}

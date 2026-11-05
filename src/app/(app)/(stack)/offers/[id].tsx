import { useLocalSearchParams } from 'expo-router'
import OfferDetailScreen from '@/screens/my/offer-detail-screen'

const OfferDetail = () => {
  const { id, box } = useLocalSearchParams<{ id: string; box?: 'received' | 'sent' }>()
  return <OfferDetailScreen id={id} box={box === 'sent' ? 'sent' : 'received'} />
}

export default OfferDetail

import { useLocalSearchParams } from 'expo-router'
import OfferMessagesScreen from '@/screens/my/offer-messages-screen'

const OfferMessages = () => {
  const { id, box } = useLocalSearchParams<{ id: string; box?: 'received' | 'sent' }>()
  return <OfferMessagesScreen id={id} box={box === 'sent' ? 'sent' : 'received'} />
}

export default OfferMessages

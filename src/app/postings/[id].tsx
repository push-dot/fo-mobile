import { useLocalSearchParams } from 'expo-router'
import PostingDetailScreen from '@/screens/jobs/posting-detail-screen'

const Posting = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PostingDetailScreen id={id} />
}

export default Posting

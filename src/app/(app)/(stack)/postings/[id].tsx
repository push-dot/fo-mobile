import { useLocalSearchParams } from 'expo-router'
import { detailFrom } from '@/shared/components/detail-url'
import PostingDetailScreen from '@/screens/jobs/posting-detail-screen'

const Posting = () => {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>()
  return <PostingDetailScreen id={id} from={detailFrom(from)} />
}

export default Posting

import { useLocalSearchParams } from 'expo-router'
import { PostingDetailScreen } from '../../../../features/detail/PostingDetailScreen'

export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PostingDetailScreen id={id} />
}

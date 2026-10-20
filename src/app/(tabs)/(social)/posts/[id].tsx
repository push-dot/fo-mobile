import { useLocalSearchParams } from 'expo-router'
import { PostDetailScreen } from '../../../../features/social/PostDetailScreen'

export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PostDetailScreen id={id} />
}

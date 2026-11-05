import { useLocalSearchParams } from 'expo-router'
import PostDetailScreen from '@/screens/social/post-detail-screen'

const Post = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PostDetailScreen id={id} />
}

export default Post

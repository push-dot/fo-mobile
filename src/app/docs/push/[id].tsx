import { useLocalSearchParams } from 'expo-router'
import { PushDocScreen } from '@/screens/my/push-docs-screen'

const PushDoc = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PushDocScreen id={id} />
}

export default PushDoc

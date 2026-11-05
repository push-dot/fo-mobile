import { useLocalSearchParams } from 'expo-router'
import PushDocScreen from '@/screens/my/push-doc-screen'

const PushDoc = () => {
  const { id, jobId } = useLocalSearchParams<{ id: string; jobId?: string }>()
  return <PushDocScreen id={id} jobId={jobId} />
}

export default PushDoc

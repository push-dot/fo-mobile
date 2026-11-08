import { useLocalSearchParams } from 'expo-router'
import { fromSheetParam } from '@/features/my'
import PushDocScreen from '@/screens/my/push-doc-screen'

const PushDoc = () => {
  const { id, jobId, sheet } = useLocalSearchParams<{ id: string; jobId?: string; sheet?: string }>()
  return <PushDocScreen id={id} jobId={jobId} sheet={fromSheetParam(sheet)} />
}

export default PushDoc

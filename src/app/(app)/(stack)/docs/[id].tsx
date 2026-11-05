import { useLocalSearchParams } from 'expo-router'
import DocViewerScreen from '@/screens/my/doc-viewer-screen'

const Doc = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DocViewerScreen id={id} />
}

export default Doc

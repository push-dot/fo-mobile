import { useLocalSearchParams } from 'expo-router'
import { DocViewerScreen } from '../../../../features/my/DocViewerScreen'

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DocViewerScreen id={id} />
}

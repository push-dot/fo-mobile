import { useLocalSearchParams } from 'expo-router'
import { DocRenameSheet } from '@/features/my'

const FileRenameRoute = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DocRenameSheet id={id} source />
}

export default FileRenameRoute

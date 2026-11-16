import { router, useLocalSearchParams } from 'expo-router'
import { Sheet } from '@/shared/components'
import { DOC_TO_PROFILE_COPY, useConvertDocument } from '@/features/my'

const DocToProfileSheetScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const convert = useConvertDocument((documentId, jobId) => {
    router.back()
    router.push({ pathname: '/docs/push/[id]', params: { id: documentId, ...(jobId ? { jobId } : {}) } })
  })
  return (
    <Sheet
      title={DOC_TO_PROFILE_COPY.title}
      description={DOC_TO_PROFILE_COPY.body}
      action={{ label: DOC_TO_PROFILE_COPY.action, onPress: () => convert.mutate(id), pending: convert.isPending }}
    >
      {null}
    </Sheet>
  )
}

export default DocToProfileSheetScreen

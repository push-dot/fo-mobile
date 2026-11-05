import { router } from 'expo-router'
import { View } from 'react-native'
import { PickRow, pickResume, SHEET_SWAP_MS, useDocImport } from '@/features/my'
import { Sheet } from '@/shared/components'

const DocImportSheetScreen = () => (
  <Sheet title="서류 가져오기">
    <View>
      <PickRow
        icon="folder"
        tone="ac"
        title="파일에서 고르기"
        sub="PDF, DOCX · 20MB까지"
        onPress={() => {
          router.back()
          setTimeout(() => void pickResume().then((file) => file && useDocImport.setState({ file })), SHEET_SWAP_MS)
        }}
      />
      <PickRow
        icon="doc"
        tone="green"
        title="에이전트로 새로 만들기"
        sub="대화하면서 이력서를 써요"
        onPress={() => {
          router.back()
          router.push('/(app)/(stack)/(tabs)/(chat)/chat')
        }}
      />
    </View>
  </Sheet>
)

export default DocImportSheetScreen

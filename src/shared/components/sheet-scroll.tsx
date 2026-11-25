import { ScrollView, View, type ScrollViewProps } from 'react-native'

const SheetScroll = (props: ScrollViewProps) => (
  <View collapsable={false}>
    <ScrollView {...props} />
  </View>
)

export default SheetScroll

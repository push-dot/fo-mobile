import { ScrollView, View, type ScrollViewProps } from 'react-native'

/** react-native-screens stretches a ScrollView that is a direct child of a form sheet over the whole sheet, so keep it one view deeper. */
const SheetScroll = (props: ScrollViewProps) => (
  <View collapsable={false}>
    <ScrollView {...props} />
  </View>
)

export default SheetScroll

import { PlatformColor, Pressable, View } from 'react-native'
import { hitSlopTo, type } from '../../theme'
import Text from './text'

const NAV_HEIGHT = 52
const RESET_MIN_WIDTH = 56

/** iOS filter sheet header (.inav): 52 high, the 17 semibold title centred between two 56 slots, a system-blue 17 regular 초기화 right. A regular sheet has no close button; a drag or the scrim closes it. */
const FilterSheetNav = ({ title, onReset }: { title: string; onReset: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: NAV_HEIGHT }}>
    <View style={{ minWidth: RESET_MIN_WIDTH }} />
    <Text v="h3" weight="600" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
      {title}
    </Text>
    <Pressable accessibilityRole="button" onPress={onReset} hitSlop={{ ...hitSlopTo(type.h3.lineHeight), left: 12, right: 12 }} style={{ minWidth: RESET_MIN_WIDTH, alignItems: 'flex-end' }}>
      <Text v="h3" weight="400" style={{ color: PlatformColor('systemBlue') }}>
        초기화
      </Text>
    </Pressable>
  </View>
)

export default FilterSheetNav

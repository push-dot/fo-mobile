import { PlatformColor, Pressable, View } from 'react-native'
import { hitSlopTo, type } from '../../theme'
import GlassButton from './glass-button'
import Text from './text'

const NAV_HEIGHT = 52
const RESET_MIN_WIDTH = 56

/** iOS filter sheet header (.inav): 52 high, the glass close left, the title centred between it and a system-blue 17 regular 초기화. */
const FilterSheetNav = ({ title, onClose, onReset }: { title: string; onClose: () => void; onReset: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: NAV_HEIGHT }}>
    <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />
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

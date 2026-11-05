import { SvgXml } from 'react-native-svg'
import { BRAND } from '@push/design-system'
import { useThemeMode } from '../../theme'

const Mascot = ({ size = 36 }: { size?: number }) => (
  <SvgXml xml={BRAND[useThemeMode() === 'dark' ? 'push-mascot-on-dark' : 'push-mascot-on-light']} width={size} height={size} />
)

export default Mascot

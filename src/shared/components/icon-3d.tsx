import { SvgXml } from 'react-native-svg'
import { ICONS_3D, type Icon3DName } from './icon-data'

const Icon3D = ({ name, size = 30 }: { name: Icon3DName; size?: number }) => {
  return <SvgXml xml={ICONS_3D[name]} width={size} height={size} />
}

export default Icon3D

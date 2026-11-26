import { SvgAst } from 'react-native-svg'
import { ICONS_3D, type Icon3DName } from '@push/design-system'
import { astOf } from './icon'

const Icon3D = ({ name, size = 30 }: { name: Icon3DName; size?: number }) => {
  return <SvgAst ast={astOf(ICONS_3D[name])} override={{ width: size, height: size }} />
}

export default Icon3D

import { CircularProgressIndicator } from '@expo/ui/jetpack-compose'
import { size as sizeModifier } from '@expo/ui/jetpack-compose/modifiers'
import { useColors, type Colors } from '../../theme'
import { SPINNER } from './constants'
import NativeHost from './native-host'

const TRACK_ALPHA = Math.round(SPINNER.trackOpacity * 255)
  .toString(16)
  .padStart(2, '0')

const Spinner = ({ size = SPINNER.size, color = 'acText' }: { size?: number; color?: keyof Colors }) => {
  const stroke = useColors()[color]
  return (
    <NativeHost matchContents>
      <CircularProgressIndicator
        color={stroke}
        trackColor={`${stroke}${TRACK_ALPHA}`}
        strokeWidth={(size * SPINNER.stroke) / SPINNER.box}
        modifiers={[sizeModifier(size, size)]}
      />
    </NativeHost>
  )
}

export default Spinner

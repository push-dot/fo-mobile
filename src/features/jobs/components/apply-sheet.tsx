import { View } from 'react-native'
import { Text } from '../../../shared/components'
import { spacing } from '../../../theme'
import type { ApplyDoc } from '../types'
import { extraNote } from '../utils'
import DocRow from './doc-row'

type Props = {
  main: ApplyDoc[]
  extras: ApplyDoc[]
  pickedId?: string
  extraIds: string[]
  onPick: (id: string) => void
  onToggleExtra: (id: string) => void
  error: boolean
}

const ApplySheet = ({ main, extras, pickedId, extraIds, onPick, onToggleExtra, error }: Props) => (
  <View>
    {main.map((d) => (
      <DocRow key={d.id} doc={d} on={d.id === pickedId} onPress={() => onPick(d.id)} />
    ))}
    {extras.map((d) => (
      <DocRow key={d.id} doc={{ ...d, note: extraNote(d) }} on={extraIds.includes(d.id)} onPress={() => onToggleExtra(d.id)} />
    ))}
    {error ? (
      <Text v="c1" color="red" style={{ marginTop: spacing[3] }}>
        지원하지 못했어요. 잠시 후 다시 눌러 주세요.
      </Text>
    ) : null}
  </View>
)

export default ApplySheet

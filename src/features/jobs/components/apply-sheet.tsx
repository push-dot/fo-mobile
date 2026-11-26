import { View } from 'react-native'
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
}

const ApplySheet = ({ main, extras, pickedId, extraIds, onPick, onToggleExtra }: Props) => (
  <View>
    {main.map((d) => (
      <DocRow key={d.id} doc={d} on={d.id === pickedId} onPress={() => onPick(d.id)} />
    ))}
    {extras.map((d) => (
      <DocRow key={d.id} doc={{ ...d, note: extraNote(d) }} multi on={extraIds.includes(d.id)} onPress={() => onToggleExtra(d.id)} />
    ))}
  </View>
)

export default ApplySheet

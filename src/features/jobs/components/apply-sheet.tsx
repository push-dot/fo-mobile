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
    <Text v="c1" color={error ? 'red' : 't3'} style={{ marginTop: spacing[3] }}>
      {error ? '지원하지 못했어요. 잠시 후 다시 눌러 주세요.' : '지원하면 마이 › 내 활동 › 지원활동에 기록돼요.'}
    </Text>
  </View>
)

export default ApplySheet

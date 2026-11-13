import { Platform, TextInput, View } from 'react-native'
import { Glass, GlassButton, Icon, Text, TopBar } from '@/shared/components'
import { fontFor, radius, spacing, type, useColors } from '../../../../theme'
import { useHardwareBack } from '@/shared/utility'
import type { FindStep } from '../../utils/find'

const ios = Platform.OS === 'ios'

type Props = { query: string; label: string; onQuery: (q: string) => void; onStep: (step: FindStep) => void; onClose: () => void }

/** Takes the place of the header pill (ChatBotHeaderFind). */
export const FindBar = ({ query, label, onQuery, onStep, onClose }: Props) => {
  const c = useColors()
  useHardwareBack(onClose)
  const field = (
    <View style={{ height: 44, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: 14, backgroundColor: ios ? 'transparent' : c.fill }}>
      <Icon name="search" size={18} color="t1" />
      <TextInput
        autoFocus
        value={query}
        onChangeText={onQuery}
        returnKeyType="search"
        accessibilityLabel="채팅에서 찾기"
        placeholder="채팅에서 찾기"
        placeholderTextColor={c.t3}
        style={{ flex: 1, minWidth: 0, height: 44, padding: 0, ...fontFor('400'), fontSize: type.b1.fontSize, letterSpacing: type.b1.letterSpacing, color: c.t1 }}
      />
      <Text v="c1" weight="700" color="t3">
        {label}
      </Text>
    </View>
  )
  return (
    <TopBar
      translucent
      chat
      left={ios ? <Glass style={{ height: 44, borderRadius: radius.pill }}>{field}</Glass> : field}
      right={
        <>
          <GlassButton
            iconSize={20}
            actions={[
              { icon: 'up', label: '이전 결과', onPress: () => onStep('older') },
              { icon: 'down', label: '다음 결과', onPress: () => onStep('newer') },
            ]}
          />
          <GlassButton circle iconSize={20} actions={[{ icon: 'x', label: '찾기 닫기', onPress: onClose }]} />
        </>
      }
    />
  )
}

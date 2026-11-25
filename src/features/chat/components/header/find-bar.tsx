import { Platform, TextInput, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Glass, GlassButton, Icon, Text, TopBar } from '@/shared/components'
import { fontFor, useColors } from '../../../../theme'
import { useHardwareBack } from '@/shared/utility'
import type { FindStep } from '../../utils/find'

const ios = Platform.OS === 'ios'

type Props = { query: string; label: string; onQuery: (q: string) => void; onStep: (step: FindStep) => void; onClose: () => void }

const FindBar = ({ query, label, onQuery, onStep, onClose }: Props) => {
  const c = useColors()
  useHardwareBack(onClose)
  const field = (
    <View style={[styles.field, !ios && styles.fieldFill]}>
      <Icon name="search" size={18} color="t1" />
      <TextInput
        autoFocus
        value={query}
        onChangeText={onQuery}
        returnKeyType="search"
        accessibilityLabel="채팅에서 찾기"
        placeholder="채팅에서 찾기"
        placeholderTextColor={c.t3}
        style={styles.input}
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
      left={ios ? <Glass style={styles.glass}>{field}</Glass> : field}
      right={
        <>
          <GlassButton
            iconSize={20}
            actions={[
              { icon: 'chev-up', label: '이전 결과', onPress: () => onStep('older') },
              { icon: 'down', label: '다음 결과', onPress: () => onStep('newer') },
            ]}
          />
          <GlassButton circle iconSize={20} actions={[{ icon: 'x', label: '찾기 닫기', onPress: onClose }]} />
        </>
      }
    />
  )
}

const styles = StyleSheet.create((theme) => ({
  field: { height: 44, borderRadius: theme.radius.pill, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], paddingHorizontal: 14, backgroundColor: 'transparent' },
  fieldFill: { backgroundColor: theme.colors.fill },
  input: { flex: 1, minWidth: 0, height: 44, padding: 0, ...fontFor('400'), fontSize: theme.type.b1.fontSize, letterSpacing: theme.type.b1.letterSpacing, color: theme.colors.t1 },
  glass: { height: 44, borderRadius: theme.radius.pill },
}))

export default FindBar

import { Pressable } from 'react-native'
import { Text } from '@/shared/components'

/** A grey link under a bubble's text: the label underlined, then "›" (ChatApprove "Push 프로필 ›", ChatPh6ResultFail "다시 저장하기 ›"). */
const BubbleLink = ({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) => (
  <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
    <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20 }}>
      <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' }}>
        {label}
      </Text>{' '}
      ›
    </Text>
  </Pressable>
)

export default BubbleLink

import { Pressable, View } from 'react-native'
import { Icon, Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import type { CreditBanner as Banner } from './state'

const LABEL = { plan: '플랜 업그레이드', credits: '크레딧 구매' } as const

const LINE = { fontSize: 14, lineHeight: 20 } as const

/** The monthly allowance is spent (ChatBotHeaderLimit, ChatBotHeaderLimitUltra). */
export const CreditBanner = ({ banner, onAction }: { banner: Banner; onAction: (action: 'plan' | 'credits') => void }) => {
  const c = useColors()
  const [first, ...rest] = banner.lines
  return (
    <View
      accessibilityRole="alert"
      style={{ marginHorizontal: spacing[4], marginBottom: spacing[2], flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 18, backgroundColor: c.redSoft }}
    >
      <Icon name="alert" size={20} color="red" />
      <Text v="c1" color="red" style={{ flex: 1, ...LINE }}>
        <Text v="c1" color="red" weight="700" style={LINE}>
          {first}
        </Text>
        {rest.length ? ` ${rest.join(' ')}` : ''}
      </Text>
      {banner.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onAction(banner.action!)}
          style={{ height: 36, paddingHorizontal: spacing[3], borderRadius: 18, justifyContent: 'center', backgroundColor: c.bg }}
        >
          <Text v="c1" weight="700" style={{ fontSize: 14 }}>
            {LABEL[banner.action]}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

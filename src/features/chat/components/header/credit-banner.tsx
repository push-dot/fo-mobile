import { Pressable, View } from 'react-native'
import { Icon, Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import { bannerText, type CreditBanner as Banner } from './state'

const LABEL = { plan: '플랜 업그레이드', credits: '크레딧 구매' } as const

const LINE = { fontSize: 14, lineHeight: 20 } as const

/**
 * The monthly allowance is spent (ChatBotHeaderLimit, ChatBotHeaderLimitUltra). The boards' `.limitbar` after the audit layer:
 * one grey `bg2` bar, regular `t1` text, a `t2` icon and a black button (rules 3, 15, 18): no red, no bold.
 * It sits 12 above the box (board: bar bottom 718, box top 730).
 */
export const CreditBanner = ({ banner, onAction }: { banner: Banner; onAction: (action: 'plan' | 'credits') => void }) => {
  const c = useColors()
  return (
    <View
      accessibilityRole="alert"
      style={{ marginHorizontal: spacing[4], marginBottom: spacing[3], flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 18, backgroundColor: c.bg2 }}
    >
      <Icon name="alert" size={20} color="t2" />
      <Text v="c1" style={{ flex: 1, ...LINE }}>
        {bannerText(banner)}
      </Text>
      {banner.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onAction(banner.action!)}
          style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: c.t1 }}
        >
          <Text v="c1" weight="700" color="bg" style={{ fontSize: 14 }}>
            {LABEL[banner.action]}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

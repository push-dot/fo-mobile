import { Pressable, View } from 'react-native'
import { Icon, Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import { bannerText, type CreditBanner as Banner } from './state'
import { creditBannerMarginBottom } from '../../utils/composer-geometry'

const LABEL = { plan: '플랜 업그레이드', credits: '크레딧 구매' } as const

const LINE = { fontSize: 14, lineHeight: 20 } as const

export const CreditBanner = ({ banner, onAction }: { banner: Banner; onAction: (action: 'plan' | 'credits') => void }) => {
  const c = useColors()
  return (
    <View
      accessibilityRole="alert"
      style={{ marginHorizontal: spacing[4], marginBottom: creditBannerMarginBottom, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 18, backgroundColor: c.bg2 }}
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

import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon, Text } from '@/shared/components'
import { bannerText, type CreditBanner as Banner } from './state'
import { creditBannerMarginBottom } from '../../utils/composer-geometry'

const LABEL = { plan: '플랜 업그레이드', credits: '크레딧 구매' } as const

const CreditBanner = ({ banner, onAction }: { banner: Banner; onAction: (action: 'plan' | 'credits') => void }) => (
  <View accessibilityRole="alert" style={styles.banner}>
    <Icon name="alert" size={20} color="t2" />
    <Text v="c1" style={styles.message}>
      {bannerText(banner)}
    </Text>
    {banner.action ? (
      <Pressable accessibilityRole="button" onPress={() => onAction(banner.action!)} style={styles.action}>
        <Text v="c1" weight="700" color="bg" style={styles.actionLabel}>
          {LABEL[banner.action]}
        </Text>
      </Pressable>
    ) : null}
  </View>
)

const styles = StyleSheet.create((theme) => ({
  banner: {
    marginHorizontal: theme.spacing[4],
    marginBottom: creditBannerMarginBottom,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 18,
    backgroundColor: theme.colors.bg2,
  },
  message: { flex: 1, fontSize: 14, lineHeight: 20 },
  action: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: theme.colors.t1 },
  actionLabel: { fontSize: 14 },
}))

export default CreditBanner

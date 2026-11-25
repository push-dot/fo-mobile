import { View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { useColors } from '../../../theme'
import { PROVIDER_MARK } from '../constants'
import type { LoginProvider } from '../utils'

const AccountPill = ({ email, provider }: { email: string; provider: LoginProvider | null }) => {
  const c = useColors()
  return (
    <View style={styles.pill}>
      {provider ? <SvgXml xml={PROVIDER_MARK[provider]} width={16} height={16} color={c.t1} /> : null}
      <Text v="c1" weight="600" color="t2" numberOfLines={1} style={styles.email}>
        {email}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bg2,
  },
  email: { flexShrink: 1 },
}))

export default AccountPill

import { View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { Text } from '../../../shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { PROVIDER_MARK } from '../constants'
import type { LoginProvider } from '../utils'

const AccountPill = ({ email, provider }: { email: string; provider: LoginProvider | null }) => {
  const c = useColors()
  return (
    <View
      style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: radius.pill, backgroundColor: c.bg2 }}
    >
      {provider ? <SvgXml xml={PROVIDER_MARK[provider]} width={16} height={16} color={c.t1} /> : null}
      <Text v="c1" weight="600" color="t2" numberOfLines={1} style={{ flexShrink: 1 }}>
        {email}
      </Text>
    </View>
  )
}

export default AccountPill

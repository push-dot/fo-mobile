import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { spacing } from '../../../theme'
import { SheetHead, Text } from '../../../shared/components'

// iOS (.ihead + .ichips2): the 13 regular group title sits right over the chips; Android keeps the bold title.
const FilterGroup = ({ title, children }: { title?: string; children: ReactNode }) => {
  const ios = Platform.OS === 'ios'
  return (
    <View style={{ gap: ios ? 0 : spacing[3] }}>
      {title ? ios ? <SheetHead>{title}</SheetHead> : <Text v="b2" weight="700">{title}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>{children}</View>
    </View>
  )
}

export default FilterGroup

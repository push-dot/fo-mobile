import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'

const EMPTY_INSET = 40
export const EMPTY_RESERVE = 140

const PageEmpty = ({ children, reserve = EMPTY_RESERVE }: { children: ReactNode; reserve?: number }) => {
  const insets = useSafeAreaInsets()
  return <View style={styles.empty(reserve, insets.bottom)}>{children}</View>
}

const styles = StyleSheet.create((theme) => ({
  empty: (reserve: number, bottom: number) => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: EMPTY_INSET,
    paddingBottom: Math.max(reserve - theme.spacing[6] - bottom, 0),
  }),
}))

export default PageEmpty

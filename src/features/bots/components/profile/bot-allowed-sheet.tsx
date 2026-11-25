import { useEffect } from 'react'
import { View } from 'react-native'
import { Button, Sheet, SheetScroll, Text, useSheetScrollMax } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '../../../../theme'
import { useBotProfile, useRevokeAllowedSite } from '../../api/hooks'
import type { BotAddress } from '../../types'
import { ALLOWED_BODY, REVOKE_LABEL, allowedLine, allowedTitle } from './profile-rows'

const ROW_MIN = 64

const BotAllowedSheet = ({ address, onClose }: { address: BotAddress; onClose: () => void }) => {
  const profile = useBotProfile(address)
  const revoke = useRevokeAllowedSite()
  const bound = useSheetScrollMax()
  const sites = profile.data?.allowedSites ?? []
  const bot = profile.data?.bot
  const loaded = profile.data !== undefined
  useEffect(() => {
    if (loaded && sites.length === 0) onClose()
  }, [loaded, sites.length, onClose])
  return (
    <Sheet gap={spacing[2]} onLayout={bound.onSheetLayout}>
      <Text v="h3" accessibilityRole="header" style={styles.title}>
        {allowedTitle(sites.length)}
      </Text>
      <Text v="b2" color="t2">
        {ALLOWED_BODY}
      </Text>
      <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout}>
        {sites.map((site) => (
          <View
            key={site.id}
            style={styles.row}
          >
            <View style={styles.site}>
              <Text v="b1" weight="600" numberOfLines={1}>
                {site.host}
              </Text>
              <Text v="c1" color="t3">
                {allowedLine(site.allowedAt, site.kind)}
              </Text>
            </View>
            <Button
              label={REVOKE_LABEL}
              variant="secondary"
              size="sm"
              onPress={() => {
                if (bot) void revoke(bot, site.host).catch(() => undefined)
              }}
            />
          </View>
        ))}
      </SheetScroll>
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  title: { paddingTop: theme.spacing[1] },
  scroll: (maxHeight: number | undefined) => ({ marginTop: theme.spacing[2], maxHeight }),
  row: { minHeight: ROW_MIN, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.line },
  site: { flex: 1, gap: 2 },
}))

export default BotAllowedSheet

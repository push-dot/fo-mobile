import { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { Button, Sheet, Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import { useBotProfile, useRevokeAllowedSite } from '../../api/hooks'
import type { BotAddress } from '../../types'
import { ALLOWED_BODY, REVOKE_LABEL, allowedLine, allowedTitle } from './profile-rows'

const ROW_MIN = 64
const LIST_MAX = ROW_MIN * 5

// BotProfileAllowed, BotProfileAllowedRevoke, BotProfileChiefAllowed: `.sheet2` with the title and the one-line promise,
// then one `min-height: 64` row per site. 허용 해제 acts at once; the list shrinks (Revoke shows the 1 left of 2).
const BotAllowedSheet = ({ address, onClose }: { address: BotAddress; onClose: () => void }) => {
  const c = useColors()
  const profile = useBotProfile(address)
  const revoke = useRevokeAllowedSite()
  const sites = profile.data?.allowedSites ?? []
  const bot = profile.data?.bot
  const loaded = profile.data !== undefined
  useEffect(() => {
    if (loaded && sites.length === 0) onClose()
  }, [loaded, sites.length, onClose])
  return (
    <Sheet gap={spacing[2]}>
      <Text v="h3" accessibilityRole="header" style={{ paddingTop: spacing[1] }}>
        {allowedTitle(sites.length)}
      </Text>
      <Text v="b2" color="t2">
        {ALLOWED_BODY}
      </Text>
      <ScrollView style={{ marginTop: spacing[2], maxHeight: LIST_MAX }}>
        {sites.map((site) => (
          <View
            key={site.id}
            style={{
              minHeight: ROW_MIN,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
              borderTopWidth: 1,
              borderTopColor: c.line,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
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
                if (bot) void revoke(bot, site.id).catch(() => undefined)
              }}
            />
          </View>
        ))}
      </ScrollView>
    </Sheet>
  )
}

export default BotAllowedSheet

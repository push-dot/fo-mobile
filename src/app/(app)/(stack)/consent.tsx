import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useReferenceConsent } from '@/features/my'
import { CONSENT_AGREE, CONSENT_BODY, CONSENT_DETAIL, CONSENT_FOOT, CONSENT_LATER, CONSENT_MORE, CONSENT_TITLE, grantConsent, laterConsent, useConsentPrompt } from '@/features/chat'
import { Button, Sheet, Text, hitSlopTo } from '@/shared/components'
import { spacing } from '@/theme'

const ConsentScreen = () => {
  const consent = useReferenceConsent()
  const [more, setMore] = useState(false)
  useEffect(
    () => () => {
      if (useConsentPrompt.getState().open) laterConsent()
    },
    [],
  )
  return (
    <Sheet title={CONSENT_TITLE} description={CONSENT_BODY}>
      <Pressable accessibilityRole="button" hitSlop={hitSlopTo(18)} onPress={() => setMore((v) => !v)} style={{ alignSelf: 'flex-start' }}>
        <Text v="c1" weight="600" color="acText" style={{ textDecorationLine: 'underline' }}>
          {CONSENT_MORE}
        </Text>
      </Pressable>
      {more ? <Text v="b2" color="t2">{CONSENT_DETAIL}</Text> : null}
      <View style={{ gap: spacing[2] }}>
        <Button label={CONSENT_AGREE} disabled={consent.saving} onPress={() => consent.save(true, { onSuccess: () => (grantConsent(), router.back()) })} />
        <Button variant="secondary" label={CONSENT_LATER} onPress={() => (laterConsent(), router.back())} />
      </View>
      <Text v="c1" color="t3" style={{ textAlign: 'center' }}>
        {CONSENT_FOOT}
      </Text>
    </Sheet>
  )
}

export default ConsentScreen

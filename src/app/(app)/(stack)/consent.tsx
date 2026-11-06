import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useReferenceConsent } from '@/features/my'
import { CONSENT_AGREE, CONSENT_BODY, CONSENT_DETAIL, CONSENT_FOOT, CONSENT_LATER, CONSENT_MORE, CONSENT_TITLE, grantConsent, laterConsent, useConsentPrompt } from '@/features/chat'
import { Button, Sheet, Text } from '@/shared/components'
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
    <Sheet gap={spacing[3]}>
      <Text v="h2" accessibilityRole="header" style={{ paddingTop: spacing[1] }}>
        {CONSENT_TITLE}
      </Text>
      <Text v="b2" color="t2">
        {CONSENT_BODY}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => setMore((v) => !v)} style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, marginVertical: -spacing[2] }}>
        <Text v="c1" weight="600" color="acText" style={{ textDecorationLine: 'underline' }}>
          {CONSENT_MORE}
        </Text>
      </Pressable>
      {more ? <Text v="b2" color="t2">{CONSENT_DETAIL}</Text> : null}
      <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
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

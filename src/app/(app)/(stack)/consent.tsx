import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { useReferenceConsent } from '@/features/my'
import { CONSENT_AGREE, CONSENT_BODY, CONSENT_DETAIL, CONSENT_FOOT, CONSENT_LATER, CONSENT_MORE, CONSENT_TITLE, grantConsent, laterConsent, useConsentPrompt } from '@/features/chat'
import { Button, Sheet, Text } from '@/shared/components'

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
    <Sheet
      title={CONSENT_TITLE}
      description={CONSENT_BODY}
      action={{ label: CONSENT_AGREE, disabled: consent.saving, onPress: () => consent.save(true, { onSuccess: () => (grantConsent(), router.back()) }) }}
    >
      <Pressable accessibilityRole="button" onPress={() => setMore((v) => !v)}>
        <Text v="b2" weight="700" color="acText">
          {CONSENT_MORE}
        </Text>
      </Pressable>
      {more ? <Text v="b2" color="t2">{CONSENT_DETAIL}</Text> : null}
      <Button variant="secondary" label={CONSENT_LATER} onPress={() => (laterConsent(), router.back())} />
      <Text v="c1" color="t3">
        {CONSENT_FOOT}
      </Text>
    </Sheet>
  )
}

export default ConsentScreen

import { useIsFocused } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { BottomSheet, Button, Text } from '@/shared/components'
import { useReferenceConsent } from '@/features/my'
import {
  CONSENT_AGREE,
  CONSENT_BODY,
  CONSENT_DETAIL,
  CONSENT_FOOT,
  CONSENT_LATER,
  CONSENT_MORE,
  CONSENT_TITLE,
} from '../constants'
import { askConsent, grantConsent, laterConsent, useConsentPrompt } from '../stores'

export const ConsentSheet = () => {
  const focused = useIsFocused()
  const open = useConsentPrompt((s) => s.open)
  const consent = useReferenceConsent()
  const [more, setMore] = useState(false)

  useEffect(() => {
    if (focused && consent.data?.referenceData === false) askConsent(false)
  }, [focused, consent.data?.referenceData])

  return (
    <BottomSheet
      visible={open && focused}
      onClose={laterConsent}
      title={CONSENT_TITLE}
      description={CONSENT_BODY}
      action={{
        label: CONSENT_AGREE,
        disabled: consent.saving,
        onPress: () => consent.save(true, { onSuccess: () => grantConsent() }),
      }}
    >
      <Pressable accessibilityRole="button" onPress={() => setMore((v) => !v)}>
        <Text v="b2" weight="700" color="acText">
          {CONSENT_MORE}
        </Text>
      </Pressable>
      {more ? <Text v="b2" color="t2">{CONSENT_DETAIL}</Text> : null}
      <Button variant="secondary" label={CONSENT_LATER} onPress={laterConsent} />
      <Text v="c1" color="t3">
        {CONSENT_FOOT}
      </Text>
    </BottomSheet>
  )
}

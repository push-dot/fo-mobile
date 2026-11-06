import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import {
  AccountPill,
  PHONE_BODY,
  PHONE_TITLE,
  PhoneField,
  SEND_CODE,
  formatNational,
  mapPhoneAuthError,
  nationalDigits,
  phoneFailureLine,
  sendPhoneCode,
  toE164,
  usePhoneAuth,
} from '@/features/auth'
import { Button, CtaBar, Text, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const PhoneScreen = () => {
  const c = useColors()
  const email = usePhoneAuth((state) => state.email)
  const provider = usePhoneAuth((state) => state.provider)
  const digits = usePhoneAuth((state) => state.digits)
  const setDigits = usePhoneAuth((state) => state.setDigits)
  const setCooldown = usePhoneAuth((state) => state.setCooldown)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const e164 = toE164(digits)

  const send = () => {
    if (!e164) return
    setBusy(true)
    setError(null)
    sendPhoneCode(e164)
      .then((sent) => {
        setCooldown(Date.now() + sent.cooldownSeconds * 1000)
        router.push('/verify-phone')
      })
      .catch((caught: unknown) => {
        const mapped = mapPhoneAuthError(caught)
        if (mapped.kind === 'cooldown') {
          setCooldown(Date.now() + mapped.retryAfterSec * 1000)
          router.push('/verify-phone')
          return
        }
        setError(phoneFailureLine(mapped))
      })
      .finally(() => setBusy(false))
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[3] }}>
        {email ? (
          <View style={{ marginBottom: 18 }}>
            <AccountPill email={email} provider={provider} />
          </View>
        ) : null}
        <Text accessibilityRole="header" v="h1" style={{ fontSize: 24, lineHeight: 33 }}>
          {PHONE_TITLE}
        </Text>
        <Text v="b2" color="t2" style={{ marginTop: spacing[2] }}>
          {PHONE_BODY}
        </Text>
        <View style={{ marginTop: 28 }}>
          <PhoneField
            value={formatNational(digits)}
            onChange={(next) => {
              const incoming = nationalDigits(next)
              if (incoming === digits && next.length < formatNational(digits).length) {
                setDigits(digits.slice(0, -1))
                return
              }
              setDigits(incoming)
            }}
          />
        </View>
        {error ? (
          <Text v="c1" color="red" accessibilityRole="alert" style={{ marginTop: spacing[3] }}>
            {error}
          </Text>
        ) : null}
      </View>
      <CtaBar>
        <Button label={SEND_CODE} disabled={!e164 || busy} onPress={send} style={{ flex: 1 }} />
      </CtaBar>
    </View>
  )
}

export default PhoneScreen

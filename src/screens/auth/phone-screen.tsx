import { useEffect, useState } from 'react'
import { Keyboard, Pressable, View } from 'react-native'
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
import { Button, CtaBar, Text, TopBar, useKeyboardHeight } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'

const PhoneScreen = () => {
  const keyboard = useKeyboardHeight()
  const email = usePhoneAuth((state) => state.email)
  const provider = usePhoneAuth((state) => state.provider)
  const mode = usePhoneAuth((state) => state.mode)
  const pendingToken = usePhoneAuth((state) => state.pendingToken)
  const digits = usePhoneAuth((state) => state.digits)
  const setDigits = usePhoneAuth((state) => state.setDigits)
  const setCooldown = usePhoneAuth((state) => state.setCooldown)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const e164 = toE164(digits)

  const lost = mode === 'social' && !pendingToken
  useEffect(() => {
    if (lost) router.replace('/sign-in')
  }, [lost])

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

  if (lost) return null

  return (
    <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.body}>
        {email ? (
          <View style={styles.pill}>
            <AccountPill email={email} provider={provider} />
          </View>
        ) : null}
        <Text accessibilityRole="header" v="h1" style={styles.title}>
          {PHONE_TITLE}
        </Text>
        <Text v="b2" color="t2" style={styles.subtitle}>
          {PHONE_BODY}
        </Text>
        <View style={styles.field}>
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
          <Text v="c1" color="red" accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </Pressable>
      <CtaBar lift={keyboard}>
        <Button label={SEND_CODE} disabled={!e164 || busy} onPress={send} style={styles.flex} />
      </CtaBar>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  body: { paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[3] },
  pill: { marginBottom: 18 },
  title: { fontSize: 24, lineHeight: 33 },
  subtitle: { marginTop: theme.spacing[2] },
  field: { marginTop: 28 },
  error: { marginTop: theme.spacing[3] },
  flex: { flex: 1 },
}))

export default PhoneScreen

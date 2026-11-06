import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import {
  OTHER_NUMBER,
  REGISTERED_TITLE,
  emailFromPendingToken,
  loginFailureCopy,
  loginTarget,
  registeredBody,
  registeredButton,
  useAppleSignIn,
  usePhoneAuth,
  type LoginProvider,
} from '@/features/auth'
import { signIn, signInWithApple, type SignInOutcome } from '@/shared/infrastructure'
import { Button, CtaBar, Text, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const continueWith = (provider: LoginProvider, outcome: SignInOutcome) => {
  if (outcome.kind !== 'phone') return
  usePhoneAuth.getState().beginSocial(outcome.pendingToken, emailFromPendingToken(outcome.pendingToken), provider)
  router.replace('/phone')
}

const PhoneRegisteredScreen = () => {
  const c = useColors()
  const apple = useAppleSignIn()
  const providers = usePhoneAuth((state) => state.providers)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ title: string; body: string } | null>(null)
  const target = loginTarget(providers, apple)
  const list = registeredButton(providers)

  useEffect(() => {
    if (providers.length === 0) router.replace('/phone')
  }, [providers.length])

  const login = (provider: LoginProvider) => {
    setBusy(true)
    setFailure(null)
    const attempt = provider === 'apple' ? signInWithApple() : signIn(provider)
    attempt
      .then((outcome) => {
        if (outcome.kind === 'cancelled') return
        if (outcome.kind === 'failed') {
          setFailure(loginFailureCopy(provider))
          return
        }
        continueWith(provider, outcome)
      })
      .catch(() => setFailure(loginFailureCopy(provider)))
      .finally(() => setBusy(false))
  }

  const press = () => {
    if (target === 'choose') {
      router.replace('/sign-in')
      return
    }
    if (target) login(target)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[3], gap: 10 }}>
        <Text accessibilityRole="header" v="h1">
          {REGISTERED_TITLE}
        </Text>
        <Text v="b2" color="t2">
          {registeredBody(providers)}
        </Text>
        {failure ? (
          <View accessibilityRole="alert" style={{ gap: spacing[1] }}>
            <Text v="c1" weight="700" color="red">
              {failure.title}
            </Text>
            <Text v="c1" color="red">
              {failure.body}
            </Text>
          </View>
        ) : null}
      </View>
      <CtaBar>
        <View style={{ flex: 1, gap: spacing[2] }}>
          <Button label={list} disabled={busy || target == null} onPress={press} />
          <Button
            label={OTHER_NUMBER}
            variant="secondary"
            disabled={busy}
            onPress={() => {
              usePhoneAuth.getState().setDigits('')
              router.dismissTo('/phone')
            }}
          />
        </View>
      </CtaBar>
    </View>
  )
}

export default PhoneRegisteredScreen

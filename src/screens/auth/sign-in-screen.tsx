import { useState } from 'react'
import { Alert, Pressable, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  APPLE,
  APPLE_START,
  GITHUB,
  GITHUB_START,
  COMPACT_HEIGHT,
  GOOGLE,
  GOOGLE_START,
  LOGO_LABEL,
  LOGO_SIZE,
  LOGO_SIZE_COMPACT,
  LOGO_TOP,
  LOGO_TOP_COMPACT,
  PHONE_START,
  ProviderButton,
  emailFromPendingToken,
  loginFailureCopy,
  useAppleSignIn,
  usePhoneAuth,
  type LoginProvider,
} from '@/features/auth'
import { DEV_AUTH_TOKEN, signIn, signInWithApple, signInWithDevToken, type SignInOutcome } from '@/shared/infrastructure'
import { Mascot, Text } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const devToken = __DEV__ ? DEV_AUTH_TOKEN : undefined

const continueWith = (provider: LoginProvider, outcome: SignInOutcome) => {
  if (outcome.kind !== 'phone') return
  usePhoneAuth.getState().beginSocial(outcome.pendingToken, emailFromPendingToken(outcome.pendingToken), provider)
  router.push('/phone')
}

// A failed login is the platform's own alert (iOS alert, Android dialog), not a box drawn on the screen.
const fail = (provider: LoginProvider) => {
  const { title, body } = loginFailureCopy(provider)
  Alert.alert(title, body, [{ text: '확인' }])
}

const SignInScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const compact = useWindowDimensions().height < COMPACT_HEIGHT
  const apple = useAppleSignIn()
  const [busy, setBusy] = useState(false)

  const run = (provider: LoginProvider) => {
    setBusy(true)
    const attempt = provider === 'apple' ? signInWithApple() : signIn(provider)
    attempt
      .then((outcome) => {
        if (outcome.kind === 'cancelled') return
        if (outcome.kind === 'failed') {
          fail(provider)
          return
        }
        continueWith(provider, outcome)
      })
      .catch(() => fail(provider))
      .finally(() => setBusy(false))
  }

  const startPhone = () => {
    usePhoneAuth.getState().beginPhone()
    router.push('/phone')
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ marginTop: insets.top + (compact ? LOGO_TOP_COMPACT : LOGO_TOP), alignItems: 'center', gap: spacing[5], paddingHorizontal: 28 }}>
        <View accessible accessibilityRole="image" accessibilityLabel={LOGO_LABEL} style={{ marginBottom: 10 }}>
          <Mascot size={compact ? LOGO_SIZE_COMPACT : LOGO_SIZE} />
        </View>
        <Text accessibilityRole="header" v="h1" style={{ fontSize: 24, lineHeight: 33, textAlign: 'center' }}>
          {'AI와 함께 하는 커리어,\nPush에서 시작하기'}
        </Text>
      </View>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 24, gap: spacing[3] }}>
        <ProviderButton label={GOOGLE_START} logo={GOOGLE} bg={c.card} fg={c.t1} border={c.line} disabled={busy} onPress={() => run('google')} />
        {apple ? (
          <ProviderButton label={APPLE_START} logo={APPLE} bg={c.t1} fg={c.bg} disabled={busy} onPress={() => run('apple')} />
        ) : null}
        <ProviderButton label={GITHUB_START} logo={GITHUB} bg={c.t1} fg={c.bg} disabled={busy} onPress={() => run('github')} />
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={startPhone}
          style={{ alignSelf: 'center', minHeight: 44, paddingHorizontal: spacing[4], justifyContent: 'center' }}
        >
          <Text weight="600" color="t2">
            {PHONE_START}
          </Text>
        </Pressable>
        {devToken ? (
          <Pressable
            accessibilityRole="button"
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => signInWithDevToken(devToken)}
          >
            {/* Dev builds only (__DEV__). The board has no such link, so it is transparent: still in the accessibility tree for the Maestro login flows, never drawn. */}
            <Text v="c1" weight="700" style={{ color: 'transparent' }}>
              개발 토큰으로 들어가기
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

export default SignInScreen

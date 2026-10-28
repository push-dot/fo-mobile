import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { GITHUB, GITHUB_BG, GOOGLE, ProviderButton } from '@/features/auth'
import { DEV_AUTH_TOKEN, signIn, signInWithDevToken } from '@/shared/infrastructure'
import { Text } from '@/shared/components'
import { useColors } from '@/theme'

const devToken = __DEV__ ? DEV_AUTH_TOKEN : undefined

const SignInScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = (provider: 'google' | 'github') => {
    setBusy(true)
    setError(null)
    signIn(provider)
      .catch(() => setError('로그인하지 못했어요. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setBusy(false))
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="0%" rx="120%" ry="60%" fx="50%" fy="0%">
            <Stop offset="0" stopColor={c.acSoft} stopOpacity={1} />
            <Stop offset="0.7" stopColor={c.acSoft} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <View style={{ marginTop: insets.top + 96, alignItems: 'center', gap: 14, paddingHorizontal: 28 }}>
        <Text accessibilityRole="header" weight="800" style={{ fontSize: 44, lineHeight: 48, letterSpacing: -2.2 }}>
          Push<Text weight="800" color="ac" style={{ fontSize: 44, lineHeight: 48 }}>.</Text>
        </Text>
        <Text v="h1" style={{ fontSize: 24, lineHeight: 33, textAlign: 'center' }}>
          {'공고에 맞는 이력서,\n대화로 만들어요'}
        </Text>
        <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
          {'데스크톱 앱과 같은 계정으로 로그인하면\n대화와 서류가 그대로 이어져요.'}
        </Text>
      </View>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 24, gap: 10 }}>
        {error ? (
          <Text v="c1" color="red" accessibilityRole="alert" style={{ textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}
        <ProviderButton label="Google로 계속하기" logo={GOOGLE} bg={c.card} fg={c.t1} border={c.line} disabled={busy} onPress={() => run('google')} />
        <ProviderButton label="GitHub로 계속하기" logo={GITHUB} bg={GITHUB_BG} fg="#FFFFFF" disabled={busy} onPress={() => run('github')} />
        {devToken ? (
          <Pressable
            accessibilityRole="button"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => signInWithDevToken(devToken)}
          >
            <Text v="c1" weight="700" color="acText">
              개발 토큰으로 들어가기
            </Text>
          </Pressable>
        ) : null}
        <Text v="c2" color="t3" style={{ textAlign: 'center', marginTop: 6 }}>
          계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요.
        </Text>
      </View>
    </View>
  )
}

export default SignInScreen

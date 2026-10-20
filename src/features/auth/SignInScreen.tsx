import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, RadialGradient, Rect, SvgXml, Stop } from 'react-native-svg'
import { signIn } from '../../lib/auth'
import { DEV_AUTH_TOKEN } from '../../lib/config'
import { useSession } from '../../lib/session'
import { radius, useColors } from '../../theme'
import { Text } from '../../ui'

const devToken = __DEV__ ? DEV_AUTH_TOKEN : undefined

// Brand marks from the SignIn board (not part of the line icon set).
const GOOGLE = `<svg viewBox="0 0 24 24"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2Z" fill="#FBBC05"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z" fill="#EA4335"/></svg>`
const GITHUB = `<svg viewBox="0 0 24 24"><path fill="#FFFFFF" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>`
// GitHub's brand black; same in light and dark per board.
const GITHUB_BG = '#16191D'

function ProviderButton({ label, logo, bg, fg, border, disabled, onPress }: { label: string; logo: string; bg: string; fg: string; border?: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      <View
        style={{ height: 56, borderRadius: radius.md, backgroundColor: bg, borderWidth: border ? 1 : 0, borderColor: border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <SvgXml xml={logo} width={20} height={20} />
        <Text v="h3" weight="700" style={{ color: fg, fontSize: 17 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

/** 로그인 (SignIn board). OAuth logic stays in lib/auth. */
export function SignInScreen() {
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
            onPress={() =>
              useSession.getState().set({
                accessToken: devToken,
                refreshToken: '',
                expiresIn: 0,
                user: { id: 'dev', displayName: '개발자', locale: 'ko' },
              })
            }
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

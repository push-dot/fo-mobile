import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import {
  TERM_ROWS,
  TERMS_ALL,
  TERMS_BODY,
  TERMS_OPTIONAL,
  TERMS_REQUIRED,
  TERMS_START,
  TERMS_TITLE,
  TRY_AGAIN,
  TermRow,
  saveTerms,
  usePhoneAuth,
} from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { Button, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const blank = () => Object.fromEntries(TERM_ROWS.map((row) => [row.id, false]))

const TermsScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const held = usePhoneAuth((state) => state.held)
  const clear = usePhoneAuth((state) => state.clear)
  const [checked, setChecked] = useState<Record<string, boolean>>(blank)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const all = TERM_ROWS.every((row) => checked[row.id])
  const requiredOk = TERM_ROWS.filter((row) => row.required).every((row) => checked[row.id])

  useEffect(() => {
    if (!held) router.replace('/sign-in')
  }, [held])

  const toggleAll = () => {
    const next = !all
    setChecked(Object.fromEntries(TERM_ROWS.map((row) => [row.id, next])))
  }

  const submit = () => {
    if (!held || !requiredOk) return
    setBusy(true)
    setError(null)
    saveTerms(held.accessToken, Boolean(checked.marketing))
      .then(async () => {
        await useSession.getState().set(held)
        clear()
      })
      .catch(() => setError(TRY_AGAIN))
      .finally(() => setBusy(false))
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 8 }}>
        <Text accessibilityRole="header" v="h1">
          {TERMS_TITLE}
        </Text>
        <Text v="b2" color="t3">
          {TERMS_BODY}
        </Text>
        <View style={{ marginTop: 16 }}>
          <TermRow label={TERMS_ALL} checked={all} onPress={toggleAll} />
          {TERM_ROWS.map((row) => (
            <TermRow
              key={row.id}
              label={row.label}
              badge={row.required ? TERMS_REQUIRED : TERMS_OPTIONAL}
              checked={Boolean(checked[row.id])}
              onPress={() => setChecked((current) => ({ ...current, [row.id]: !current[row.id] }))}
            />
          ))}
        </View>
        {error ? (
          <Text v="c1" color="red" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <Button label={TERMS_START} disabled={!requiredOk || busy} onPress={submit} />
      </View>
    </View>
  )
}

export default TermsScreen

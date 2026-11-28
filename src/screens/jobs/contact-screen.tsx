import { useEffect, useState } from 'react'
import { Keyboard, Pressable, ScrollView, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { PhoneField, formatNational, nationalDigits, toE164 } from '@/features/auth'
import {
  CONTACT_BODY,
  CONTACT_CODE,
  CONTACT_CONFIRM,
  CONTACT_CONTINUE,
  CONTACT_DONE,
  CONTACT_EMAIL,
  CONTACT_KEY,
  CONTACT_PHONE,
  CONTACT_SEND,
  CONTACT_TAKEN_BODY,
  CONTACT_TAKEN_CANCEL,
  CONTACT_TAKEN_MOVE,
  CONTACT_TAKEN_TITLE,
  CONTACT_TITLE,
  CONTACT_USE_LOGIN,
  canMoveDocuments,
  contactFailureLine,
  contactMailSent,
  contactMoved,
  sendContactEmailCode,
  sendContactPhoneCode,
  useContact,
  verifyContactEmail,
  verifyContactPhone,
} from '@/features/jobs'
import { Button, CtaBar, TopBar, Text, TextField, askConfirm, showToast, useKeyboardHeight } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
const CODE_RE = /^\d{6}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Done = () => (
  <Text v="b2" weight="700" color="ac">
    {CONTACT_DONE}
  </Text>
)

const Line = ({ text, alert }: { text: string | null; alert?: boolean }) =>
  text ? (
    <Text v="c1" color={alert ? 'red' : 't2'} accessibilityRole={alert ? 'alert' : undefined} style={styles.line}>
      {text}
    </Text>
  ) : null

const ContactScreen = () => {
  const postingId = param(useLocalSearchParams<{ postingId?: string }>().postingId)
  const keyboard = useKeyboardHeight()
  const qc = useQueryClient()
  const contact = useContact().data
  const [digits, setDigits] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneSent, setPhoneSent] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [mailCode, setMailCode] = useState('')
  const [mailSentTo, setMailSentTo] = useState<string | null>(null)
  const [mailError, setMailError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const e164 = toE164(digits)
  const typed = (email ?? contact?.loginEmail ?? '').trim()
  const isLogin = !!contact?.loginEmail && typed.toLowerCase() === contact.loginEmail.toLowerCase()
  const phoneDone = !!contact?.phone
  const emailDone = !!contact?.email

  useEffect(() => {
    if (!postingId) router.back()
  }, [postingId])

  const refresh = () => qc.invalidateQueries({ queryKey: CONTACT_KEY })

  const run = (job: () => Promise<unknown>) => {
    setBusy(true)
    job().finally(() => setBusy(false))
  }

  const sendPhone = () =>
    e164 &&
    run(() =>
      sendContactPhoneCode(e164)
        .then(() => {
          setPhoneSent(true)
          setPhoneError(null)
        })
        .catch((error: unknown) => setPhoneError(contactFailureLine(error))),
    )

  const confirmPhone = (moveDocuments = false): Promise<unknown> =>
    verifyContactPhone({ phone: e164!, code: phoneCode, ...(moveDocuments ? { moveDocuments } : {}) })
      .then((done) => {
        if (moveDocuments) showToast({ message: contactMoved(done.moved), tone: 'success' })
        setPhoneError(null)
        return refresh()
      })
      .catch((error: unknown) => {
        if (!moveDocuments && canMoveDocuments(error)) {
          askConfirm({
            title: CONTACT_TAKEN_TITLE,
            body: CONTACT_TAKEN_BODY,
            cancel: CONTACT_TAKEN_CANCEL,
            confirm: CONTACT_TAKEN_MOVE,
            onConfirm: () => run(() => confirmPhone(true)),
          })
          return
        }
        setPhoneError(contactFailureLine(error))
      })

  const sendMail = () =>
    run(() =>
      sendContactEmailCode(typed)
        .then((sent) => {
          setMailError(null)
          if ('verified' in sent) return refresh()
          setMailSentTo(typed)
          return undefined
        })
        .catch((error: unknown) => setMailError(contactFailureLine(error))),
    )

  const confirmMail = () =>
    mailSentTo &&
    run(() =>
      verifyContactEmail(mailSentTo, mailCode)
        .then(() => {
          setMailError(null)
          return refresh()
        })
        .catch((error: unknown) => setMailError(contactFailureLine(error))),
    )

  if (!postingId) return null

  return (
    <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Text accessibilityRole="header" v="h1" style={styles.title}>
          {CONTACT_TITLE}
        </Text>
        <Text v="b2" color="t2" style={styles.subtitle}>
          {CONTACT_BODY}
        </Text>

        <View style={styles.section}>
          <Text v="c1" weight="700" color="t3">
            {CONTACT_PHONE}
          </Text>
          {phoneDone ? (
            <View style={styles.doneRow}>
              <Text v="b1" weight="700">
                {formatNational(`0${contact.phone!.replace(/^\+82/, '')}`)}
              </Text>
              <Done />
            </View>
          ) : (
            <>
              <PhoneField value={formatNational(digits)} onChange={(next) => setDigits(nationalDigits(next))} />
              {phoneSent ? (
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <TextField value={phoneCode} onChangeText={(v) => setPhoneCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" placeholder={CONTACT_CODE} accessibilityLabel={CONTACT_CODE} />
                  </View>
                  <Button label={CONTACT_CONFIRM} disabled={busy || !CODE_RE.test(phoneCode)} onPress={() => run(() => confirmPhone())} />
                </View>
              ) : null}
              <Button label={CONTACT_SEND} variant={phoneSent ? 'secondary' : undefined} disabled={busy || !e164} onPress={sendPhone} />
              <Line text={phoneError} alert />
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text v="c1" weight="700" color="t3">
            {CONTACT_EMAIL}
          </Text>
          {emailDone ? (
            <View style={styles.doneRow}>
              <Text v="b1" weight="700">
                {contact.email}
              </Text>
              <Done />
            </View>
          ) : (
            <>
              <TextField
                value={typed}
                onChangeText={(v) => {
                  setEmail(v)
                  setMailSentTo(null)
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="name@example.com"
                accessibilityLabel={CONTACT_EMAIL}
              />
              {mailSentTo ? (
                <>
                  <Line text={contactMailSent(mailSentTo)} />
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <TextField value={mailCode} onChangeText={(v) => setMailCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" placeholder={CONTACT_CODE} accessibilityLabel={CONTACT_CODE} />
                    </View>
                    <Button label={CONTACT_CONFIRM} disabled={busy || !CODE_RE.test(mailCode)} onPress={confirmMail} />
                  </View>
                </>
              ) : null}
              <Button
                label={isLogin ? CONTACT_USE_LOGIN : CONTACT_SEND}
                variant={mailSentTo ? 'secondary' : undefined}
                disabled={busy || !EMAIL_RE.test(typed)}
                onPress={sendMail}
              />
              <Line text={mailError} alert />
            </>
          )}
        </View>
      </ScrollView>
      <CtaBar lift={keyboard}>
        <Button
          label={CONTACT_CONTINUE}
          disabled={!phoneDone || !emailDone}
          onPress={() => router.replace({ pathname: '/apply', params: { postingId } })}
          style={styles.flex}
        />
      </CtaBar>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  body: { paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[3], paddingBottom: theme.spacing[6] },
  title: { fontSize: 24, lineHeight: 33 },
  subtitle: { marginTop: theme.spacing[2] },
  section: { marginTop: 28, gap: theme.spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  line: { marginTop: -theme.spacing[1] },
  flex: { flex: 1 },
}))

export default ContactScreen

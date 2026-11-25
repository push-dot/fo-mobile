import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { Button, Icon, Sheet, SheetScroll, Switch, Text, TextField, useSheetScrollMax } from '@/shared/components'
import { CHOICE_HANDOFF_MS, useChoiceModal } from '@/shared/navigation'
import { StyleSheet } from 'react-native-unistyles'
import { iosSeparator, onAccent, useThemeMode } from '@/theme'
import { PM8, pm8Row, pm8SecondaryFill } from './choice-sheet-layout'

const MARK = 24

const Mark = ({ checked, multi }: { checked: boolean; multi: boolean }) => (
  <View style={[styles.mark, checked ? styles.markOn : styles.markOff]}>
    {checked ? multi ? <Icon name="check" size={MARK - 10} color={onAccent} /> : <View style={styles.dot} /> : null}
  </View>
)

const ChoiceSheetScreen = () => {
  const dark = useThemeMode() === 'dark'
  const request = useChoiceModal((s) => s.request)
  const bound = useSheetScrollMax()
  const picked = useRef(false)
  const form = request?.form
  const [selected, setSelected] = useState(form?.selected ?? [])
  const [on, setOn] = useState(form?.toggle?.on ?? false)
  const [text, setText] = useState('')
  const onDismiss = request?.onDismiss
  useEffect(() => {
    if (!request) router.back()
  }, [request])
  useEffect(() => () => {
    if (!picked.current) onDismiss?.()
  }, [onDismiss])
  if (!request) return null
  const run = (onPress: () => void) => {
    if (picked.current) return
    picked.current = true
    router.back()
    setTimeout(onPress, CHOICE_HANDOFF_MS)
  }
  const input = request.input
  const confirm = form
    ? { label: form.confirmLabel(selected, on), onPress: () => form.onConfirm(selected, on), disabled: !form.allowEmpty && !selected.length }
    : input
      ? { label: input.confirm, onPress: () => input.onSubmit(text.trim()), disabled: !text.trim() }
      : request.confirm
  const closeLabel = request.confirm?.closeLabel
  const toggleOption = (i: number) => setSelected((cur) => (form?.multi ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]) : [i]))
  const secondaryFill = pm8SecondaryFill(Platform.OS === 'ios', dark)
  const secondaryStyle = secondaryFill ? styles.fill(secondaryFill) : null
  return (
    <Sheet onLayout={bound.onSheetLayout} gap={PM8.gap} topGap={PM8.topGap} actionGap={PM8.actionGap} bottomExtra={PM8.bottomExtra} secondaryFill={secondaryFill} slimAction action={confirm && !closeLabel ? { label: confirm.label, onPress: () => run(confirm.onPress), disabled: 'disabled' in confirm && confirm.disabled } : undefined}
      secondary={request.confirm?.secondary ? { label: request.confirm.secondary.label, onPress: () => run(request.confirm!.secondary!.onPress) } : undefined}
    >
      <View style={styles.head}>
        <Text v="h3" weight="600" accessibilityRole="header" style={styles.title}>
          {request.title}
        </Text>
      </View>
      <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {request.message ? (
        <Text v={request.items ? 'b2' : 'b1'} color="t2" style={[styles.message, (request.items || form) && styles.messageGap]}>
          {request.message}
        </Text>
      ) : null}
      {request.items && request.buttons ? (
        <View style={styles.buttons}>
          {request.items.map((item, i) => (
            <Button key={item.label} label={item.label} variant={i === 0 ? 'primary' : 'secondary'} weight="700" onPress={() => run(item.onPress)} style={[styles.pill, i === 0 ? null : secondaryStyle]} />
          ))}
        </View>
      ) : null}
      {request.items && !request.buttons ? (
        <View style={styles.list}>
          {request.items.map((item, i) => (
            <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => run(item.onPress)} style={styles.row(i === request.items!.length - 1)}>
              <View style={styles.flex}>
                <Text v="h3" weight="400" color={item.destructive ? 'red' : 't1'}>
                  {item.label}
                </Text>
                {item.sub ? (
                  <Text v="c1" color="t3">
                    {item.sub}
                  </Text>
                ) : null}
              </View>
              {item.chevron ? (
                <Text v="b2" color="t3">
                  ›
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
      {input ? (
        <TextField value={text} onChangeText={setText} placeholder={input.placeholder} autoCapitalize="none" autoCorrect={false} keyboardType={input.keyboardType} autoFocus accessibilityLabel={input.placeholder} />
      ) : null}
      {form ? (
        <View style={styles.list}>
          {form.options.map((option, i) => (
            <Pressable
              key={option.label}
              accessibilityRole={form.multi ? 'checkbox' : 'radio'}
              accessibilityState={form.multi ? { checked: selected.includes(i) } : { selected: selected.includes(i) }}
              onPress={() => toggleOption(i)}
              style={styles.row(i === form.options.length - 1 && !form.toggle, true)}
            >
              <Mark checked={selected.includes(i)} multi={!!form.multi} />
              <View style={styles.flex}>
                <Text v="h3" weight="400">
                  {option.label}
                </Text>
                {option.sub ? (
                  <Text v="c1" color="t3">
                    {option.sub}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
          {form.toggle ? (
            <View style={styles.row(true)}>
              <Text v="h3" weight="400" style={styles.flex}>
                {form.toggle.label}
              </Text>
              <Switch value={on} onValueChange={setOn} label={form.toggle.label} />
            </View>
          ) : null}
        </View>
      ) : null}
      </SheetScroll>
      {confirm && closeLabel ? (
        <View style={styles.pair}>
          <Button label={closeLabel} variant="secondary" onPress={() => router.back()} style={[styles.pairButton, secondaryStyle]} />
          <Button label={confirm.label} onPress={() => run(confirm.onPress)} style={styles.pairButton} />
        </View>
      ) : null}
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  mark: { width: MARK, height: MARK, borderRadius: MARK / 2, borderColor: theme.colors.t3, alignItems: 'center', justifyContent: 'center' },
  markOn: { borderWidth: 0, backgroundColor: theme.colors.ac },
  markOff: { borderWidth: 2, backgroundColor: 'transparent' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: onAccent },
  fill: (backgroundColor: string) => ({ backgroundColor }),
  row: (last: boolean, mark = false) => ({
    ...pm8Row(mark),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[1],
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: Platform.OS === 'ios' ? iosSeparator[theme.mode] : theme.colors.line,
  }),
  head: { minHeight: 52, justifyContent: 'center' },
  title: { textAlign: 'center' },
  scroll: (maxHeight: number) => ({ maxHeight }),
  content: { gap: PM8.gap },
  message: { paddingHorizontal: theme.spacing[1], marginBottom: 0 },
  messageGap: { marginBottom: 2 },
  buttons: { gap: theme.spacing[2], marginTop: PM8.buttonsTop },
  pill: { minHeight: 52, borderRadius: 26 },
  list: { gap: 6 },
  flex: { flex: 1 },
  pair: { flexDirection: 'row', gap: theme.spacing[2], marginTop: 10 },
  pairButton: { flex: 1, minHeight: 52, borderRadius: 26 },
}))

export default ChoiceSheetScreen

import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, useWindowDimensions, View } from 'react-native'
import { MdTable } from '@/features/chat'
import { Button, Sheet, Switch, Text, TextField } from '@/shared/components'
import { CHOICE_HANDOFF_MS, useChoiceModal } from '@/shared/navigation'
import { iosSeparator, spacing, useColors, useThemeMode } from '@/theme'

// .pm8: title 52 high, the body 4 under it (.pm-b: the message and the rows 6 apart, the sheet's own gap is 4), the button 14 under the last block.
const ChoiceSheetScreen = () => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  const request = useChoiceModal((s) => s.request)
  const picked = useRef(false)
  const form = request?.form
  const [selected, setSelected] = useState(form?.selected ?? [])
  const [on, setOn] = useState(form?.toggle?.on ?? false)
  const [text, setText] = useState('')
  const { width } = useWindowDimensions()
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
  const row = (last: boolean) => ({ minHeight: 50, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing[3], paddingHorizontal: spacing[1], borderBottomWidth: last ? 0 : 1, borderBottomColor: Platform.OS === 'ios' ? iosSeparator[dark ? 'dark' : 'light'] : c.line })
  return (
    <Sheet gap={4} actionGap={10} slimAction action={confirm && !closeLabel ? { label: confirm.label, onPress: () => run(confirm.onPress), disabled: 'disabled' in confirm && confirm.disabled } : undefined}
      secondary={request.confirm?.secondary ? { label: request.confirm.secondary.label, onPress: () => run(request.confirm!.secondary!.onPress) } : undefined}
    >
      <View style={{ minHeight: 52, justifyContent: 'center' }}>
        <Text v="h3" weight="600" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {request.title}
        </Text>
      </View>
      {request.message ? (
        <Text v={request.items ? 'b2' : 'b1'} color="t2" style={{ paddingHorizontal: spacing[1], marginBottom: request.items || form ? 2 : 0 }}>
          {request.message}
        </Text>
      ) : null}
      {request.table ? (
        <View style={{ paddingHorizontal: spacing[1] }}>
          <MdTable table={{ kind: 'table', head: request.table.head, rows: request.table.rows }} width={width - spacing[4] * 2 - spacing[1] * 2} />
        </View>
      ) : null}
      {request.items ? (
        <View style={{ gap: 6 }}>
          {request.items.map((item, i) => (
            <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => run(item.onPress)} style={row(i === request.items!.length - 1)}>
              <View style={{ flex: 1 }}>
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
        <View style={{ gap: 6 }}>
          {form.options.map((option, i) => (
            <Pressable
              key={option.label}
              accessibilityRole={form.multi ? 'checkbox' : 'radio'}
              accessibilityState={form.multi ? { checked: selected.includes(i) } : { selected: selected.includes(i) }}
              onPress={() => toggleOption(i)}
              style={row(i === form.options.length - 1 && !form.toggle)}
            >
              <View style={{ flex: 1 }}>
                <Text v="h3" weight="400">
                  {option.label}
                </Text>
                {option.sub ? (
                  <Text v="c1" color="t3">
                    {option.sub}
                  </Text>
                ) : null}
              </View>
              {selected.includes(i) ? (
                <Text v="h3" weight="700" color="acText">
                  ✓
                </Text>
              ) : null}
            </Pressable>
          ))}
          {form.toggle ? (
            <View style={row(true)}>
              <Text v="h3" weight="400" style={{ flex: 1 }}>
                {form.toggle.label}
              </Text>
              <Switch value={on} onValueChange={setOn} label={form.toggle.label} />
            </View>
          ) : null}
        </View>
      ) : null}
      {confirm && closeLabel ? (
        <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: 10 }}>
          <Button label={closeLabel} variant="secondary" onPress={() => router.back()} style={{ flex: 1, minHeight: 52, borderRadius: 26 }} />
          <Button label={confirm.label} onPress={() => run(confirm.onPress)} style={{ flex: 1, minHeight: 52, borderRadius: 26 }} />
        </View>
      ) : null}
    </Sheet>
  )
}

export default ChoiceSheetScreen

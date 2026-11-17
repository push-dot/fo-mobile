import { router } from 'expo-router'
import { useMemo } from 'react'
import { Platform, View } from 'react-native'
import { Button, PM8, pm8SecondaryFill, Sheet, SheetScroll, Spinner, Text, useSheetScrollMax } from '@/shared/components'
import { openUrl } from '@/shared/infrastructure'
import { spacing, useThemeMode } from '@/theme'
import { useMaterialDetail } from '../api/hooks'
import { LOAD_ERROR, OPEN_LABEL, SEND_LABEL } from '../constants'
import type { Material, MaterialKind } from '../types'
import { detailFacts, detailTitle, sendContextOf } from '../utils/material-view'
import MaterialFacts from './material-facts'
import { useInMaterialsModal } from './in-materials-modal'
import { sendMaterial } from './send-material'

const SLIM = { flex: 1, minHeight: 52, borderRadius: 26 } as const

const KINDS: readonly MaterialKind[] = ['file', 'document', 'posting', 'link']
export const isMaterialKind = (value: string | undefined): value is MaterialKind =>
  KINDS.includes(value as MaterialKind)

/**
 * MaterialDetail*: a regular sheet over the 자료 modal. 서류로 들어가기, 공고로 이동, 바로가기. A link opens in the browser over the page. The others close the page and the modal
 * first, as the drawer's lists did: a full screen pushed inside a modal would draw under its top inset.
 */
const open = (m: Material, inModal: boolean) => {
  if (m.kind === 'link') return void openUrl(m.url)
  router.dismiss(inModal ? 2 : 1)
  if (m.kind === 'posting') router.push(`/postings/${m.id}`)
  else if (m.kind === 'document') router.push(`/docs/push/${m.id}`)
  else router.push(`/docs/${m.id}`)
}

export const MaterialDetailPage = ({ kind, id, forBot }: { kind: MaterialKind; id: string; forBot?: string }) => {
  const detail = useMaterialDetail(kind, id)
  const now = useMemo(() => new Date(), [])
  const bound = useSheetScrollMax(0.55)
  const inModal = useInMaterialsModal()
  const secondaryFill = pm8SecondaryFill(Platform.OS === 'ios', useThemeMode() === 'dark')

  const m = detail.data?.material
  if (!m) {
    return (
      <Sheet>
        {detail.isError ? (
          <View accessibilityRole="alert" style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] }}>
            <Text v="b2" color="t3">
              {LOAD_ERROR.title}
            </Text>
            <Button label={LOAD_ERROR.retry} variant="secondary" size="sm" onPress={detail.refetch} />
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
            <Spinner />
          </View>
        )}
      </Sheet>
    )
  }

  const context = sendContextOf(forBot)
  // BotPick is a sheet of its own over the 자료 modal, so this one leaves before it opens.
  const send = () => {
    if (context.from === 'home') router.back()
    sendMaterial(context, m)
  }

  return (
    <Sheet gap={PM8.gap} topGap={PM8.topGap} bottomExtra={PM8.bottomExtra} slimAction onLayout={bound.onSheetLayout}>
      <View style={{ minHeight: 52, justifyContent: 'center' }}>
        <Text v="h3" weight="600" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {detailTitle(m)}
        </Text>
      </View>
      <SheetScroll style={{ maxHeight: bound.maxHeight }} onLayout={bound.onScrollLayout}>
        <MaterialFacts facts={detailFacts(m, detail.data?.usedBy ?? [], now)} />
      </SheetScroll>
      <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: PM8.buttonsTop }}>
        <Button label={SEND_LABEL} onPress={send} style={SLIM} />
        <Button label={OPEN_LABEL[m.kind]} variant="secondary" onPress={() => open(m, inModal)} style={[SLIM, secondaryFill ? { backgroundColor: secondaryFill } : null]} />
      </View>
    </Sheet>
  )
}

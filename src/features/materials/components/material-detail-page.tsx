import { router } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, View } from 'react-native'
import { Button, Sheet, Spinner, Text } from '@/shared/components'
import { openUrl } from '@/shared/infrastructure'
import { spacing } from '@/theme'
import { useMaterialDetail } from '../api/hooks'
import { LOAD_ERROR, OPEN_LABEL, SEND_LABEL } from '../constants'
import type { Material, MaterialKind } from '../types'
import { detailFacts, detailTitle, sendContextOf } from '../utils/material-view'
import MaterialFacts from './material-facts'
import { useInMaterialsModal } from './in-materials-modal'
import { sendMaterial } from './send-material'

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
  const inModal = useInMaterialsModal()

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
  // BotPick is a page of the 자료 modal, so the sheet leaves before it opens.
  const send = () => {
    if (context.from === 'home') router.back()
    sendMaterial(context, m)
  }

  return (
    <ScrollView>
      <Sheet>
        <Text v="h3" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {detailTitle(m)}
        </Text>
        <MaterialFacts facts={detailFacts(m, detail.data?.usedBy ?? [], now)} />
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Button label={SEND_LABEL} onPress={send} style={{ flex: 1 }} />
          <Button label={OPEN_LABEL[m.kind]} variant="secondary" onPress={() => open(m, inModal)} style={{ flex: 1 }} />
        </View>
      </Sheet>
    </ScrollView>
  )
}

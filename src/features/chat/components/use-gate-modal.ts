import { router, useIsFocused } from 'expo-router'
import { useEffect, useRef } from 'react'
import { materialPickerPath, type BotId } from '@/features/bots'
import { useBookmarkList } from '@/features/my'
import { showChoiceModal } from '@/shared/navigation'
import { displayName } from '@/shared/utility/display-name'
import { useChatDocs } from '../api/hooks'
import { appendDraftText } from '../stores'
import { showReviewPage } from '../review-page'
import type { Approval, ChatItem } from '../types'
import { gateTable, openGate } from '../utils/gate-modals'
import { latestDiffLines } from '../utils/review-doc'
import { attachPickedFile } from '../utils/pick-file'
import { docMeta, postingMeta } from '../utils/quick-start-data'

const RECENT = 3
const SEE_ALL = '전체 보기'

export const useGateModal = (
  botId: string,
  chat: { approval: Approval | null; items: ChatItem[] },
  onAnswer: (text: string, choice: number | number[]) => void,
  onSay: () => void,
) => {
  const focused = useIsFocused()
  const opened = useRef<string | undefined>(undefined)
  const approval = chat.approval
  const wantsMaterials = !!approval?.sections.some((s) => s.kind === 'rows')
  const docs = useChatDocs(wantsMaterials)
  const bookmarks = useBookmarkList(wantsMaterials)
  const latest = useRef({ onAnswer, onSay, docs: docs.data, bookmarks: bookmarks.data?.data, items: chat.items })
  useEffect(() => {
    latest.current = { onAnswer, onSay, docs: docs.data, bookmarks: bookmarks.data?.data, items: chat.items }
  })
  useEffect(() => {
    if (!focused || !approval || opened.current === approval.id) return
    opened.current = approval.id
    const now = () => latest.current
    const say = () => now().onSay()
    const list = (title: string, empty: string, rows: { label: string; sub: string }[], back: () => void) => {
      showChoiceModal({
        title,
        ...(rows.length ? {} : { message: empty }),
        items: [
          ...rows.slice(0, RECENT).map((r) => ({
            label: r.label,
            sub: r.sub,
            onPress: () => {
              appendDraftText(botId, r.label)
              back()
            },
          })),
          ...(rows.length > RECENT
            ? [
                {
                  label: SEE_ALL,
                  chevron: true,
                  onPress: () => {
                    say()
                    router.push(materialPickerPath(botId as BotId))
                  },
                },
              ]
            : []),
        ],
        onDismiss: say,
      })
    }
    openGate(
      approval,
      {
        answer: (text, choice) => now().onAnswer(text, choice),
        say,
        table: gateTable(now().items),
        review: { lines: latestDiffLines(now().items), open: showReviewPage },
        change: (row, back) => {
          const kinds = () =>
            showChoiceModal({
              title: '어떤 자료로 바꿀까요?',
              message: displayName(row.title),
              items: [
                {
                  label: '내 서류에서',
                  chevron: true,
                  onPress: () => list('내 서류', '올린 서류가 아직 없어요', (now().docs ?? []).map((d) => ({ label: displayName(d.fileName), sub: docMeta(d) })), back),
                },
                {
                  label: '북마크한 공고에서',
                  chevron: true,
                  onPress: () => list('북마크한 공고', '북마크한 공고가 아직 없어요', (now().bookmarks ?? []).map((p) => ({ label: `${p.company} · ${p.title}`, sub: postingMeta(p) })), back),
                },
                { label: '파일에서 고르기', onPress: () => void attachPickedFile(botId).then(back) },
                {
                  label: '링크 붙여넣기',
                  chevron: true,
                  onPress: () =>
                    showChoiceModal({
                      title: '링크를 붙여넣어 주세요',
                      input: {
                        placeholder: 'https://',
                        confirm: '넣기',
                        keyboardType: 'url',
                        onSubmit: (text) => {
                          appendDraftText(botId, text)
                          back()
                        },
                      },
                      onDismiss: say,
                    }),
                },
              ],
              onDismiss: say,
            })
          kinds()
        },
      },
      showChoiceModal,
    )
  }, [focused, approval, botId])
}

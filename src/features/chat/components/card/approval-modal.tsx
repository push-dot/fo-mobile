import type { ReactNode } from 'react'
import { Modal, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '@/theme'
import PageModal from '../page-modal'
import type { ApprovalModalKind } from '../../utils/approval-modal'

/**
 * A card drawn as a modal (owner rule 35). `page`: the page-style modal, with a close button, the content scrolls under it.
 * `regular`: a page sheet with no X and no 취소; swiping it away hands the floor to the composer, like 직접 말하기.
 * `children` of a page modal may be a PageModal of their own (the material picker), which then replaces the header.
 */
const ApprovalModal = ({ kind, onClose, own, children }: { kind: Exclude<ApprovalModalKind, 'none'>; onClose: () => void; own?: boolean; children: ReactNode }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} allowSwipeDismissal onRequestClose={onClose}>
      {kind === 'page' && !own ? (
        <PageModal title="" onClose={onClose}>
          {children}
        </PageModal>
      ) : own ? (
        children
      ) : (
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom }}>
            {children}
          </ScrollView>
        </View>
      )}
    </Modal>
  )
}

export default ApprovalModal

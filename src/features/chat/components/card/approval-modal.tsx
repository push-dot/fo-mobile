import type { ReactNode } from 'react'
import { Modal, Platform } from 'react-native'
import PageModal from '../page-modal'

/**
 * A card drawn as a page-style modal (owner rule 35): a close button, the content scrolls under it, one button at the foot. Swiping it away hands the floor to the composer.
 * `own`: the children are a PageModal of their own (the material picker), which then replaces this one's header.
 */
const ApprovalModal = ({ title, footer, onClose, own, children }: { title: string; footer?: ReactNode; onClose: () => void; own?: boolean; children: ReactNode }) => (
  <Modal visible animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} allowSwipeDismissal onRequestClose={onClose}>
    {own ? (
      children
    ) : (
      <PageModal sheet chip title={title} onClose={onClose} footer={footer}>
        {children}
      </PageModal>
    )}
  </Modal>
)

export default ApprovalModal

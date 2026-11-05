import { Glass } from '@/shared/components'
import { radius } from '../../../theme'
import { ComposerBody, type ComposerProps } from './composer-body'

/** iOS: Liquid Glass box, 28px radius. */
export const Composer = (p: ComposerProps) => {
  return (
    <Glass interactive style={{ borderRadius: radius.xl }}>
      <ComposerBody {...p} />
    </Glass>
  )
}

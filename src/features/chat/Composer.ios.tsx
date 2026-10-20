import { Glass } from '../../ui'
import { ComposerBody, type ComposerProps } from './ComposerBody'

/** iOS: Liquid Glass box, 28px radius. */
export function Composer(p: ComposerProps) {
  return (
    <Glass interactive style={{ borderRadius: 28 }}>
      <ComposerBody {...p} />
    </Glass>
  )
}

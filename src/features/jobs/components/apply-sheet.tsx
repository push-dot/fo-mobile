import { useState } from 'react'
import { View } from 'react-native'
import { BottomSheet, Text } from '../../../shared/components'
import { useApplyPosting } from '../api/hooks'
import { docsFor } from '../constants'
import DocRow from './doc-row'

type Props = {
  postingId: string
  company: string
  visible: boolean
  onClose: () => void
  onApplied: () => void
  title?: string
}

const ApplySheet = ({ postingId, company, visible, onClose, onApplied, title }: Props) => {
  const docs = docsFor(company)
  const [resume, setResume] = useState(docs[0]!.id)
  const [portfolio, setPortfolio] = useState(false)
  const apply = useApplyPosting(postingId, onApplied)
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="어떤 서류로 지원할까요?"
      description={title ? `${company} · ${title}` : company}
      action={{
        label: apply.isPending ? '지원하는 중…' : '이 서류로 지원하기',
        onPress: () => apply.mutate(portfolio ? [resume, 'doc-portfolio'] : [resume]),
        disabled: apply.isPending,
      }}
    >
      <View>
        {docs.map((d) => {
          const on = d.kind === 'portfolio' ? portfolio : resume === d.id
          return <DocRow key={d.id} doc={d} on={on} onPress={() => (d.kind === 'portfolio' ? setPortfolio(!portfolio) : setResume(d.id))} />
        })}
      </View>
      <Text v="c1" color={apply.isError ? 'red' : 't3'}>
        {apply.isError ? '지원하지 못했어요. 잠시 후 다시 눌러 주세요.' : '지원하면 마이 › 내 활동 › 지원활동에 기록돼요.'}
      </Text>
    </BottomSheet>
  )
}

export default ApplySheet

const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

export const overwriteWarning = (labels: string[]) => {
  if (labels.length === 0) return null
  const head = labels.slice(0, -1)
  const lastHead = head[head.length - 1]
  const joined = head.length
    ? `${head
        .slice(0, -1)
        .map((l) => `${l}, `)
        .join('')}${lastHead}${hasBatchim(lastHead!) ? '과' : '와'} ${labels[labels.length - 1]}`
    : labels[0]!
  return `지금 프로필의 ${joined}${hasBatchim(labels[labels.length - 1]!) ? '은' : '는'} 이 내용으로 바뀌어요.`
}

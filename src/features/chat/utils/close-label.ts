// A gate that ends the flow reads 닫기 (owner 2026-11-15); the server still sends 그만하기 / 취소. ChatPh0Start keeps its own 그만할게요 in v425.
const CLOSERS = new Set(['그만하기', '취소'])

export const closeLabel = (label: string) => (CLOSERS.has(label) ? '닫기' : label)

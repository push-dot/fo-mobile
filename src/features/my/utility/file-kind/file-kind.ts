export const fileKind = (name: string) => (/\.docx?$/i.test(name) ? 'DOCX' : 'PDF')

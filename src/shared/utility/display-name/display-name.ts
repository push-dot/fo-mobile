const EXTENSION = /(?<=.)\.(pdf|docx?|hwpx?|pptx?|xlsx?|txt|md|png|jpe?g)$/i

export const displayName = (name: string) => name.replace(EXTENSION, '')

export const extensionOf = (name: string) => name.slice(displayName(name).length)

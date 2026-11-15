const EXTENSION = /(?<=.)\.(pdf|docx?|hwpx?|pptx?|xlsx?|txt|md|png|jpe?g)$/i

/** A file shows its name without the extension (RULINGS 41); the stored name keeps it for download and rename. */
export const displayName = (name: string) => name.replace(EXTENSION, '')

export const extensionOf = (name: string) => name.slice(displayName(name).length)

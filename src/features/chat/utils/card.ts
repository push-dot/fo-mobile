/** The page-read card is the one with 항상 허용 (server SITE_OPTIONS). Its title is the question and its summary the line under it. */
export const isSiteCard = (optionIds: readonly string[]) => optionIds.includes('approve_always')

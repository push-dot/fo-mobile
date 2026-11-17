/**
 * The text of the XL boards the harness draws (BotNewXL, ChatBotHeaderXL) is laid out for the harness XL size: iOS content size extra-extra-large
 * (RN fontScale 1.235) and Android font_scale 1.3; the next size down is 1.12 / 1.15, so 1.2 splits them. The agent boards (chat, Bot-create, Bot
 * Home, Bot Profile, Materials) share one `.xl` rule set and read this gate; the Main and JobDetail boards draw no `.xl` chrome and keep XL_TEXT_SCALE.
 */
export const XL_BOARD_TEXT_SCALE = 1.2
/** Compared in whole percent, the way the WebView zoom is sent, so native text and the job detail page flip at the same system size. */
export const isXlBoardText = (fontScale: number) => Math.round(fontScale * 100) >= Math.round(XL_BOARD_TEXT_SCALE * 100)

/**
 * Weight of the composer's typed text. The boards draw a mention still being typed ("@모아", "@": ChatEmpty, ChatMention) at 600 and every
 * other typed line (ChatKeyboardIOS: one, several, five lines) at 400. A mention token is "@" and the characters after it up to the first space;
 * once a space follows, the line is a message again.
 */
export const composerWeight = (value: string): '400' | '600' => (/^@\S*$/.test(value) ? '600' : '400')

export const composerWeight = (value: string): '400' | '600' => (/^@\S*$/.test(value) ? '600' : '400')

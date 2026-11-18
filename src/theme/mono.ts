import { Platform } from 'react-native'

/** The boards' JetBrains Mono (diff line numbers) has no asset in the app: the platform monospace face stands in. */
export const monoNumber = { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 11 }

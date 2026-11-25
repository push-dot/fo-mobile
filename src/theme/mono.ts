import { Platform } from 'react-native'

export const monoNumber = { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 11 }

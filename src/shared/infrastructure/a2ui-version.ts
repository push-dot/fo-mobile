import type { A2uiVersion } from '@push/api-client'

/**
 * The A2UI protocol each platform's renderer speaks: sent as `A2UI-Version`, and the fixtures mock mode replays.
 * iOS 1.0 must match `PushCatalog.protocolVersion` in modules/push-a2ui/ios; Android stays on v0.9.1, the newest its official renderer reads.
 * `EXPO_OS` (inlined by babel-preset-expo) instead of Platform, so the mock and its tests can read this in node.
 */
export const A2UI_VERSION: A2uiVersion = process.env.EXPO_OS === 'ios' ? '1.0' : 'v0.9.1'

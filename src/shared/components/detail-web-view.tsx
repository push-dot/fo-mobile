import { router, type Href } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, useWindowDimensions, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { spacing, useColors, useThemeMode } from '../../theme'
import { bootScript, detailUrl, HOLD_FIT_SCRIPT, SOON_FIT_SCRIPT, textSizeScript, tokenEventScript, webViewNavigation, type DetailFrom } from './detail-url'
import { API_BASE_URL, API_MOCK, WEB_BASE_URL, mockFitHolding, mockFitSoonOn, mockFitThreeOn, mockWebPlanOf, openBrowser, useSession } from '../infrastructure'
import Button from './button'
import Text from './text'

const APP_PATH = /^\/(?!\/)/

type Props = {
  path: string
  from?: DetailFrom
  onBridge?: (message: Record<string, unknown>) => void
}

const DetailWebView = ({ path, from, onBridge }: Props) => {
  const c = useColors()
  const mode = useThemeMode()
  const ref = useRef<WebView<object>>(null)
  const token = useSession((s) => s.session?.accessToken ?? null)
  const [failed, setFailed] = useState(false)
  const zoom = Math.round(useWindowDimensions().fontScale * 100)
  const applyZoom = Platform.OS === 'ios' ? textSizeScript(zoom) : undefined
  const [boot] = useState(() =>
    bootScript(
      WEB_BASE_URL,
      { token, apiBaseUrl: API_BASE_URL, mock: API_MOCK, plan: API_MOCK ? mockWebPlanOf() : undefined, fitParts: API_MOCK && mockFitThreeOn() ? 3 : undefined, theme: mode },
      `${applyZoom ?? ''}${API_MOCK && mockFitHolding() ? HOLD_FIT_SCRIPT : ''}${API_MOCK && mockFitSoonOn() ? SOON_FIT_SCRIPT : ''}`,
    ),
  )

  useEffect(() => {
    ref.current?.injectJavaScript(tokenEventScript(WEB_BASE_URL, token))
  }, [token])

  useEffect(() => {
    ref.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('push:theme',{detail:{theme:${JSON.stringify(mode)}}}));true;`)
  }, [mode])

  useEffect(() => {
    if (applyZoom) ref.current?.injectJavaScript(applyZoom)
  }, [applyZoom])

  const onNavigate = ({ url }: { url: string }) => {
    const target = webViewNavigation(url, WEB_BASE_URL)
    if (target === 'browser') void openBrowser(url)
    return target === 'load'
  }

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { type?: string; path?: unknown; url?: unknown; status?: unknown } & Record<string, unknown>
    try {
      m = JSON.parse(e.nativeEvent.data)
    } catch {
      return
    }
    // fo-web still posts its page title; the design draws no native header title, so it is dropped here.
    if (m.type === 'title') return
    if (m.type === 'open' && typeof m.path === 'string' && APP_PATH.test(m.path)) router.push(m.path as Href)
    else if (m.type === 'external' && typeof m.url === 'string' && /^https?:\/\//.test(m.url)) void openBrowser(m.url)
    else if (m.type === 'error') setFailed(true)
    else onBridge?.(m)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <WebView<object>
        ref={ref}
        key={mode}
        source={{ uri: detailUrl(WEB_BASE_URL, path, mode, API_MOCK, from) }}
        injectedJavaScriptBeforeContentLoaded={boot}
        injectedJavaScript={applyZoom}
        textZoom={zoom}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onNavigate}
        onError={() => setFailed(true)}
        style={{ backgroundColor: c.bg }}
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
      />
      {failed ? (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: spacing[4], backgroundColor: c.bg }}>
          <Text v="b2" color="t3">
            불러오지 못했어요
          </Text>
          <Button
            label="다시 시도"
            variant="secondary"
            size="sm"
            icon="retry"
            onPress={() => {
              setFailed(false)
              ref.current?.reload()
            }}
          />
        </View>
      ) : null}
    </View>
  )
}

export default DetailWebView

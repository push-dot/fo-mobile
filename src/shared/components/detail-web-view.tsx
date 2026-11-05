import { router, type Href } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, useWindowDimensions, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { spacing, useColors, useThemeMode } from '../../theme'
import { detailUrl } from './detail-url'
import { API_BASE_URL, API_MOCK, WEB_BASE_URL, openBrowser, useSession } from '../infrastructure'
import Button from './button'
import Text from './text'

type Props = {
  path: string
  onTitle?: (title: string) => void
  onBridge?: (message: Record<string, unknown>) => void
}

const DetailWebView = ({ path, onTitle, onBridge }: Props) => {
  const c = useColors()
  const mode = useThemeMode()
  const ref = useRef<WebView<object>>(null)
  const token = useSession((s) => s.session?.accessToken ?? null)
  const [failed, setFailed] = useState(false)
  const zoom = Math.round(useWindowDimensions().fontScale * 100)
  const applyZoom = Platform.OS === 'ios' ? `document.documentElement.style.webkitTextSizeAdjust='${zoom}%';true;` : undefined
  const [boot] = useState(() => `window.__PUSH__=${JSON.stringify({ token, apiBaseUrl: API_BASE_URL, mock: API_MOCK, theme: mode })};true;`)

  useEffect(() => {
    ref.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('push:token',{detail:{token:${JSON.stringify(token)}}}));true;`)
  }, [token])

  useEffect(() => {
    ref.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('push:theme',{detail:{theme:${JSON.stringify(mode)}}}));true;`)
  }, [mode])

  useEffect(() => {
    if (applyZoom) ref.current?.injectJavaScript(applyZoom)
  }, [applyZoom])

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { type?: string; title?: unknown; path?: unknown; url?: unknown; status?: unknown } & Record<string, unknown>
    try {
      m = JSON.parse(e.nativeEvent.data)
    } catch {
      return
    }
    if (m.type === 'title' && typeof m.title === 'string') onTitle?.(m.title)
    else if (m.type === 'open' && typeof m.path === 'string' && m.path.startsWith('/')) router.push(m.path as Href)
    else if (m.type === 'external' && typeof m.url === 'string' && /^https?:\/\//.test(m.url)) void openBrowser(m.url)
    else if (m.type === 'error') setFailed(true)
    else onBridge?.(m)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <WebView<object>
        ref={ref}
        key={mode}
        source={{ uri: detailUrl(WEB_BASE_URL, path, mode, API_MOCK) }}
        injectedJavaScriptBeforeContentLoaded={boot}
        injectedJavaScript={applyZoom}
        textZoom={zoom}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        style={{ backgroundColor: c.bg }}
        originWhitelist={[WEB_BASE_URL]}
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

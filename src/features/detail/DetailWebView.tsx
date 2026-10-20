import { router, type Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { API_BASE_URL, API_MOCK, WEB_BASE_URL } from '../../lib/config'
import { useSession } from '../../lib/session'
import { useColors } from '../../theme'
import { Button, Text } from '../../ui'

type Props = {
  /** fo-web path, e.g. `/postings/p1` */
  path: string
  onTitle?: (title: string) => void
}

/** fo-web page with the app ↔ web bridge (feature-spec 14). */
export function DetailWebView({ path, onTitle }: Props) {
  const c = useColors()
  const ref = useRef<WebView<object>>(null)
  const token = useSession((s) => s.session?.accessToken ?? null)
  const [failed, setFailed] = useState(false)
  // Captured once: WebView only reads injectedJavaScriptBeforeContentLoaded on load; later tokens go through push:token.
  const [boot] = useState(() => `window.__PUSH__=${JSON.stringify({ token, apiBaseUrl: API_BASE_URL, mock: API_MOCK })};true;`)

  useEffect(() => {
    ref.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('push:token',{detail:{token:${JSON.stringify(token)}}}));true;`)
  }, [token])

  // Web content is untrusted input: accept only known message shapes and safe targets.
  const onMessage = (e: WebViewMessageEvent) => {
    let m: { type?: string; title?: unknown; path?: unknown; url?: unknown; status?: unknown }
    try {
      m = JSON.parse(e.nativeEvent.data)
    } catch {
      return
    }
    if (m.type === 'title' && typeof m.title === 'string') onTitle?.(m.title)
    else if (m.type === 'open' && typeof m.path === 'string' && m.path.startsWith('/')) router.push(m.path as Href) // dynamic path from web; validated above
    else if (m.type === 'external' && typeof m.url === 'string' && /^https?:\/\//.test(m.url)) void WebBrowser.openBrowserAsync(m.url)
    else if (m.type === 'error') setFailed(true)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* <object>: the default P=undefined makes WebViewProps & undefined = never under strict null checks. */}
      <WebView<object>
        ref={ref}
        source={{ uri: `${WEB_BASE_URL}${path}${API_MOCK ? '?mock=1' : ''}` }}
        injectedJavaScriptBeforeContentLoaded={boot}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        style={{ backgroundColor: c.bg }}
        originWhitelist={[WEB_BASE_URL]}
        setSupportMultipleWindows={false}
      />
      {failed ? (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: c.bg }}>
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

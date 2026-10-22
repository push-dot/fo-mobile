import { router, type Href } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { useColors } from '../../theme'
import { API_BASE_URL, API_MOCK, WEB_BASE_URL, openBrowser, useSession } from '../infrastructure'
import Button from './button'
import Text from './text'

type Props = {
  path: string
  onTitle?: (title: string) => void
}

const DetailWebView = ({ path, onTitle }: Props) => {
  const c = useColors()
  const ref = useRef<WebView<object>>(null)
  const token = useSession((s) => s.session?.accessToken ?? null)
  const [failed, setFailed] = useState(false)
  const [boot] = useState(() => `window.__PUSH__=${JSON.stringify({ token, apiBaseUrl: API_BASE_URL, mock: API_MOCK })};true;`)

  useEffect(() => {
    ref.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('push:token',{detail:{token:${JSON.stringify(token)}}}));true;`)
  }, [token])

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { type?: string; title?: unknown; path?: unknown; url?: unknown; status?: unknown }
    try {
      m = JSON.parse(e.nativeEvent.data)
    } catch {
      return
    }
    if (m.type === 'title' && typeof m.title === 'string') onTitle?.(m.title)
    else if (m.type === 'open' && typeof m.path === 'string' && m.path.startsWith('/')) router.push(m.path as Href)
    else if (m.type === 'external' && typeof m.url === 'string' && /^https?:\/\//.test(m.url)) void openBrowser(m.url)
    else if (m.type === 'error') setFailed(true)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
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

export default DetailWebView

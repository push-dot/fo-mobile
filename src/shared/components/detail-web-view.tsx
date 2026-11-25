import { router, type Href } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, useWindowDimensions, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { StyleSheet } from 'react-native-unistyles'
import { useThemeMode } from '../../theme'
import { bootScript, detailEventScript, originOf, detailUrl, textSizeScript, routeNavigation, tokenEventScript, type DetailFrom, type DetailSeed } from './detail-url'
import { API_BASE_URL, API_MOCK, WEB_BASE_URL, mockFitHolding, mockFitSoonOn, mockFitThreeOn, mockWebPlanOf, openBrowser, useSession } from '../infrastructure'
import Button from './button'
import LoadingIndicator from './loading-indicator'
import Text from './text'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockScripts = (): { HOLD_FIT_SCRIPT: string; SOON_FIT_SCRIPT: string } => require('./detail-mock-scripts')

const APP_PATH = /^\/(?!\/)/

const LOADING_MAX_MS = 6000

const opened = new Set<string>()

const FONTS_READY_SCRIPT = `(function(){var done=false;function post(){if(done)return;done=true;window.ReactNativeWebView.postMessage(JSON.stringify({type:'fonts-ready'}))}setTimeout(post,2500);function frames(n,f){if(n===0)return f();requestAnimationFrame(function(){frames(n-1,f)})}function settle(){frames(3,function(){if(document.fonts.status==='loading'){document.fonts.ready.then(settle)}else{post()}})}settle()})();true;`

const DetailLoading = () => (
  <View accessible accessibilityLabel="불러오는 중" style={styles.cover}>
    <LoadingIndicator />
  </View>
)

type Props = {
  path: string
  from?: DetailFrom
  seed?: DetailSeed
  onBridge?: (message: Record<string, unknown>) => void
  inset?: { top: number; bottom: number }
  onScroll?: (offsetY: number) => void
}

const insetScript = (top: number, bottom: number) =>
  `(function(){var s=document.getElementById('push-inset')||document.head.appendChild(Object.assign(document.createElement('style'),{id:'push-inset'}));s.textContent='html{padding-top:${top}px;padding-bottom:${bottom}px}';})();true;`

const buildBoot = (mode: ReturnType<typeof useThemeMode>, applyZoom: string | undefined) =>
  bootScript(
    WEB_BASE_URL,
    { apiBaseUrl: API_BASE_URL, mock: API_MOCK, plan: API_MOCK ? mockWebPlanOf() : undefined, fitParts: API_MOCK && mockFitThreeOn() ? 3 : undefined, theme: mode },
    `${applyZoom ?? ''}${API_MOCK && mockFitHolding() ? mockScripts().HOLD_FIT_SCRIPT : ''}${API_MOCK && mockFitSoonOn() ? mockScripts().SOON_FIT_SCRIPT : ''}`,
  )

const injectedOf = (zoomScript: string | undefined, insetPart: string) => `${zoomScript ?? ''}${insetPart}` || undefined

const DetailWebView = ({ path, from, seed, onBridge, inset, onScroll }: Props) => {
  const mode = useThemeMode()
  const ref = useRef<WebView<object>>(null)
  const token = useSession((s) => s.session?.accessToken ?? null)
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])
  const seedRef = useRef(seed)
  const seedAt = seed?.updatedAt
  useEffect(() => {
    seedRef.current = seed
  })
  useEffect(() => {
    if (seedAt !== undefined) ref.current?.injectJavaScript(detailEventScript(WEB_BASE_URL, path, seedRef.current))
  }, [seedAt, path])
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(() => !opened.has(path))
  const zoom = Math.round(useWindowDimensions().fontScale * 100)
  const applyZoom = Platform.OS === 'ios' ? textSizeScript(zoom) : undefined
  const [boot] = useState(() => buildBoot(mode, applyZoom))

  const done = () => {
    opened.add(path)
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(() => {
      opened.add(path)
      setLoading(false)
    }, LOADING_MAX_MS)
    return () => clearTimeout(t)
  }, [path])

  useEffect(() => {
    ref.current?.injectJavaScript(tokenEventScript(WEB_BASE_URL, token))
  }, [token])

  useEffect(() => {
    ref.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('push:theme',{detail:{theme:${JSON.stringify(mode)}}}));true;`)
  }, [mode])

  useEffect(() => {
    if (applyZoom) ref.current?.injectJavaScript(applyZoom)
  }, [applyZoom])

  const fail = () => {
    setFailed(true)
    setLoading(false)
  }

  const insetTop = inset?.top ?? 0
  const insetBottom = inset?.bottom ?? 0
  useEffect(() => {
    if (inset) ref.current?.injectJavaScript(insetScript(insetTop, insetBottom))
  }, [inset, insetTop, insetBottom])

  const injected = injectedOf(applyZoom, inset ? insetScript(insetTop, insetBottom) : '')

  const onNavigate = ({ url }: { url: string }) => routeNavigation(url, WEB_BASE_URL, openBrowser)

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { type?: string; path?: unknown; url?: unknown; status?: unknown } & Record<string, unknown>
    try {
      m = JSON.parse(e.nativeEvent.data)
    } catch {
      return
    }
    if (m.type === 'title') return void ref.current?.injectJavaScript(FONTS_READY_SCRIPT)
    if (m.type === 'fonts-ready') return done()
    if (m.type === 'ready') return void ref.current?.injectJavaScript(`${detailEventScript(WEB_BASE_URL, path, seedRef.current)}${tokenEventScript(WEB_BASE_URL, tokenRef.current)}`)
    if (m.type === 'open' && typeof m.path === 'string' && APP_PATH.test(m.path)) router.push(m.path as Href)
    else if (m.type === 'external' && typeof m.url === 'string' && /^https?:\/\//.test(m.url)) void openBrowser(m.url)
    else if (m.type === 'error') fail()
    else onBridge?.(m)
  }

  return (
    <View style={styles.screen}>
      <WebView<object>
        ref={ref}
        key={mode}
        source={{ uri: detailUrl(WEB_BASE_URL, path, mode, API_MOCK, from) }}
        injectedJavaScriptBeforeContentLoaded={boot}
        injectedJavaScript={injected}
        onScroll={onScroll ? (e: { nativeEvent: { contentOffset: { y: number } } }) => onScroll(e.nativeEvent.contentOffset.y) : undefined}
        textZoom={zoom}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onNavigate}
        onError={fail}
        style={styles.web}
        originWhitelist={[`${originOf(WEB_BASE_URL)}*`, 'about:blank']}
        setSupportMultipleWindows={false}
      />
      {loading && !failed ? <DetailLoading /> : null}
      {failed ? (
        <View style={[styles.cover, styles.failed]}>
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

const styles = StyleSheet.create((theme) => ({
  cover: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  failed: { gap: theme.spacing[4] },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  web: { backgroundColor: theme.colors.bg },
}))

export default DetailWebView

import { router, type Href } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Platform, useWindowDimensions, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { spacing, useColors, useThemeMode } from '../../theme'
import { bootScript, originOf, detailUrl, textSizeScript, routeNavigation, tokenEventScript, type DetailFrom } from './detail-url'
import { API_BASE_URL, API_MOCK, WEB_BASE_URL, mockFitHolding, mockFitSoonOn, mockFitThreeOn, mockWebPlanOf, openBrowser, useSession } from '../infrastructure'
import Button from './button'
import LoadingIndicator from './loading-indicator'
import Text from './text'

// Mock-only scripts stay out of the release path: required only when the mock API is on.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockScripts = (): { HOLD_FIT_SCRIPT: string; SOON_FIT_SCRIPT: string } => require('./detail-mock-scripts')

const APP_PATH = /^\/(?!\/)/

// fo-web draws its own page in a moment after the document loads; a stalled page must not keep the skeleton up for ever.
const LOADING_MAX_MS = 6000

// A page opened once already comes from the web view's cache with its fonts in, so it opens with no loading; only a first open waits.
const opened = new Set<string>()

// Resolves after the text on screen has the web font it asked for, so no tofu or fallback glyphs show when the loading ends.
const FONTS_READY_SCRIPT = `(function(){var done=false;function post(){if(done)return;done=true;window.ReactNativeWebView.postMessage(JSON.stringify({type:'fonts-ready'}))}setTimeout(post,2500);function frames(n,f){if(n===0)return f();requestAnimationFrame(function(){frames(n-1,f)})}function settle(){frames(3,function(){if(document.fonts.status==='loading'){document.fonts.ready.then(settle)}else{post()}})}settle()})();true;`

/** The plain loading indicator over the web page until it is drawn. */
const DetailLoading = () => {
  const c = useColors()
  return (
    <View accessible accessibilityLabel="불러오는 중" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
      <LoadingIndicator />
    </View>
  )
}

type Props = {
  path: string
  from?: DetailFrom
  onBridge?: (message: Record<string, unknown>) => void
  /** The bars floating over the page: the web page keeps this much clear above and below its content and scrolls under them. */
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

const DetailWebView = ({ path, from, onBridge, inset, onScroll }: Props) => {
  const c = useColors()
  const mode = useThemeMode()
  const ref = useRef<WebView<object>>(null)
  const token = useSession((s) => s.session?.accessToken ?? null)
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])
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
    // fo-web posts its page title once the page is drawn; the loading ends when the fonts are ready too. The design draws no native header title.
    if (m.type === 'title') return void ref.current?.injectJavaScript(FONTS_READY_SCRIPT)
    // The page is drawn and its web fonts are in: ending the loading earlier shows the fallback glyphs for a moment.
    if (m.type === 'fonts-ready') return done()
    // The page asks for the token once it can listen; the app answers with a one-shot event, not a global.
    if (m.type === 'ready') return void ref.current?.injectJavaScript(tokenEventScript(WEB_BASE_URL, tokenRef.current))
    if (m.type === 'open' && typeof m.path === 'string' && APP_PATH.test(m.path)) router.push(m.path as Href)
    else if (m.type === 'external' && typeof m.url === 'string' && /^https?:\/\//.test(m.url)) void openBrowser(m.url)
    else if (m.type === 'error') fail()
    else onBridge?.(m)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
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
        style={{ backgroundColor: c.bg }}
        originWhitelist={[`${originOf(WEB_BASE_URL)}*`, 'about:blank']}
        setSupportMultipleWindows={false}
      />
      {loading && !failed ? <DetailLoading /> : null}
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

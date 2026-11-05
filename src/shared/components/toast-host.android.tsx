import { Snackbar, SnackbarHost, type SnackbarHostRef } from '@expo/ui/jetpack-compose'
import { useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette, useColors, useThemeMode } from '../../theme'
import { TOAST_BOTTOM_GAP } from './constants'
import NativeHost from './native-host'
import { hideToast, useHostedToast } from './toast-store'

/** Android: Material 3 Snackbar. Compose queues snackbars and owns their timing. */
const ToastHost = () => {
  const toast = useHostedToast()
  const ref = useRef<SnackbarHostRef>(null)
  const insets = useSafeAreaInsets()
  const c = useColors()
  const inverse = palette[useThemeMode() === 'dark' ? 'light' : 'dark']
  useEffect(() => {
    if (!toast) return
    void ref.current
      ?.showSnackbar({ message: toast.message, actionLabel: toast.action?.label, duration: toast.action ? 'long' : 'short' })
      .then((result) => {
        if (result === 'actionPerformed') toast.action?.onPress()
        hideToast(toast.id)
      })
  }, [toast])
  return (
    <NativeHost matchContents={{ vertical: true }} style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + TOAST_BOTTOM_GAP }}>
      <SnackbarHost ref={ref}>
        <Snackbar containerColor={c.t1} contentColor={c.bg} actionContentColor={inverse.acText} />
      </SnackbarHost>
    </NativeHost>
  )
}

export default ToastHost

export const consentPath = () => '/consent' as const
export const quickStartPath = (key: string) => `/quick-start/${key}` as const
export const materialPickerPath = () => '/material-picker' as const
export const accountPath = (page?: 'plan') => (page ? (`/sidebar/account?page=${page}` as const) : ('/sidebar/account' as const))
export const docsPath = () => '/sidebar/docs' as const
export const linksPath = () => '/sidebar/links' as const
export const linkAddPath = () => '/sidebar/link-add' as const
export const bookmarksPath = () => '/sidebar/bookmarks' as const
export const sidebarPath = (current?: string) => (current ? (`/sidebar?current=${current}` as const) : ('/sidebar' as const))
export const sidebarDepth = (names: string[]) => names.length - 1 - names.findLastIndex((n) => !n.startsWith('sidebar/'))

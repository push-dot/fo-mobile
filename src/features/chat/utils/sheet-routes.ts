export const consentPath = () => '/consent' as const
export const quickStartPath = (key: string) => `/quick-start/${key}` as const
export const materialsPath = () => '/materials' as const
export const accountPath = (page?: 'plan') => (page ? (`/sidebar/account?page=${page}` as const) : ('/sidebar/account' as const))
export const docsPath = () => '/sidebar/docs' as const
export const linksPath = () => '/sidebar/links' as const
export const linkAddPath = () => '/sidebar/link-add' as const
export const bookmarksPath = () => '/sidebar/bookmarks' as const
export const conversationsPath = (current?: string) => (current ? (`/sidebar/conversations?current=${current}` as const) : ('/sidebar/conversations' as const))
export const renamePath = (id: string) => `/sidebar/rename/${id}` as const

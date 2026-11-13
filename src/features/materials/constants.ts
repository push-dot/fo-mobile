import type { MaterialKind, MaterialSection, MaterialTab } from './types'

// Copy of the 봇 - 자료 boards (design version 396), word for word.

export const MATERIALS_TITLE = '자료'

/** Materials: the segmented control, in board order. */
export const TABS: { key: MaterialTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'doc', label: '서류' },
  { key: 'bookmark', label: '북마크' },
  { key: 'link', label: '링크' },
]

export const SECTION_LABEL: Record<MaterialSection, string> = { doc: '서류', bookmark: '북마크', link: '링크' }

export const SEARCH_PLACEHOLDER = '자료 이름, 회사, 주소로 검색'
export const SEND_LABEL = '보내기'

/** What the + menu (MaterialsAdd) and the empty states' buttons do. */
export type AddAction = 'link' | 'upload' | 'browse'
/** The toast 마이 › 서류 shows after an upload, the same file landing in the same place. */
export const UPLOADED = '이력서 파일을 올렸어요'
export const ADD_LABEL: Record<AddAction, string> = { link: '링크 추가', upload: '서류 올리기', browse: '공고 둘러보기' }

/** MaterialsEmpty, MaterialsEmptyDocs, MaterialsEmptyBookmarks, MaterialsEmptyLinks. */
export const EMPTY: Record<MaterialTab, { title: string; body: string; action: AddAction }> = {
  all: {
    title: '아직 자료가 없어요',
    body: '서류를 올리거나 공고를 북마크하고, 링크를 추가하면 여기 모여요. 봇이 만든 서류도 자동으로 들어와요.',
    action: 'upload',
  },
  doc: { title: '아직 서류가 없어요', body: '이력서나 경력기술서를 올리면 모든 봇이 함께 써요. 봇이 고친 서류도 여기에 저장돼요.', action: 'upload' },
  bookmark: { title: '북마크한 공고가 없어요', body: '채용공고에서 북마크하면 여기 모여요. 봇에게 공고를 바로 넘길 수 있어요.', action: 'browse' },
  link: { title: '저장한 링크가 없어요', body: 'GitHub, 블로그, 포트폴리오 주소를 저장해 두면 봇이 서류를 고칠 때 참고해요.', action: 'link' },
}

/** MaterialsSearchEmpty. The title names the query (see searchEmptyTitle). */
export const SEARCH_EMPTY_BODY = '자료 이름, 회사 이름, 링크 주소로 찾아요. 다른 단어로 다시 검색해 보세요.'

/** MaterialsLoading, MaterialsError. */
export const LIST_LOADING = '자료를 불러오는 중이에요'
export const LOAD_ERROR = { title: '자료를 불러오지 못했어요', body: '인터넷 연결을 확인하고 다시 시도해 주세요.', retry: '다시 시도' }

/** The detail sheet's second button (MaterialDetailDoc, MaterialDetailBookmark, MaterialDetailLink). */
export const OPEN_LABEL: Record<MaterialKind, string> = { file: '서류로 들어가기', document: '서류로 들어가기', posting: '공고로 이동', link: '바로가기' }
export const DELETE_LABEL = '자료 삭제'
export const UNDO_LABEL = '되돌리기'
/** The words 마이 › 서류 uses for the same two failures. */
export const CITED = '경력 기록에서 쓰고 있어 지울 수 없어요'
export const RESTORE_FAILED = '되돌리지 못했어요'

/** MaterialsLinkAdd. */
export const LINK_ADD = {
  title: '링크 추가',
  hint: '링크를 붙여넣으면 종류를 알아서 골라요.',
  kind: '종류',
  note: '추가하면 봇이 README와 커밋을 읽어 둬요',
  submit: '추가하기',
}

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LINK_ADD } from '../constants'

const source = (file: string) => readFileSync(join(__dirname, '../components', file), 'utf8')

describe('material sheets', () => {
  it('the detail sheet puts 보내기 and the open button in one row and has no delete', () => {
    const detail = source('material-detail-page.tsx')
    expect(detail).toMatch(/flexDirection: 'row'[\s\S]*SEND_LABEL[\s\S]*OPEN_LABEL/)
    expect(detail).not.toMatch(/askConfirm|useDeleteMaterial|DELETE/)
  })

  it('a long press on a list row asks the delete in a native alert', () => {
    expect(source('material-item.tsx')).toContain('onLongPress={() => onDelete(material)}')
    expect(source('confirm-delete-material.ts')).toMatch(/Alert\.alert\(copy\.title, copy\.body/)
  })

  it('the link sheet is a regular sheet with no page header', () => {
    const page = source('link-add-page.tsx')
    expect(page).toContain('<Sheet')
    expect(page).not.toContain('PageModal')
    expect(LINK_ADD).toEqual({ title: '링크 추가', submit: '추가하기' })
  })
})

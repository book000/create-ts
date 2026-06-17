import { describe, expect, it } from 'vitest'
import {
  validateLicense,
  validateOrgName,
  validateProjectName,
  validateRepoName,
} from '../src/validate.js'

describe('validateProjectName', () => {
  it('my-app → 有効', () => {
    expect(validateProjectName('my-app')).toBeUndefined()
  })

  it('MyApp → 無効（大文字）', () => {
    expect(validateProjectName('MyApp')).toBeDefined()
  })

  it('-bad-start → 無効（ハイフン始まり）', () => {
    expect(validateProjectName('-bad-start')).toBeDefined()
  })

  it('"has space" → 無効（空白）', () => {
    expect(validateProjectName('has space')).toBeDefined()
  })

  it(`${'a'.repeat(215)} → 無効（215 文字）`, () => {
    expect(validateProjectName('a'.repeat(215))).toBeDefined()
  })

  it(`${'a'.repeat(214)} → 有効（214 文字）`, () => {
    expect(validateProjectName('a'.repeat(214))).toBeUndefined()
  })

  it('空文字 → 無効（必須）', () => {
    expect(validateProjectName('')).toBeDefined()
  })

  it('undefined → 無効（必須）', () => {
    expect(validateProjectName(undefined)).toBeDefined()
  })
})

describe('validateOrgName', () => {
  it('book000 → 有効', () => {
    expect(validateOrgName('book000')).toBeUndefined()
  })

  it('Book.000 → 有効（大文字・ドット許容）', () => {
    expect(validateOrgName('Book.000')).toBeUndefined()
  })

  it('"bad org!" → 無効（空白・記号）', () => {
    expect(validateOrgName('bad org!')).toBeDefined()
  })

  it('空文字 → 無効（必須）', () => {
    expect(validateOrgName('')).toBeDefined()
  })
})

describe('validateRepoName', () => {
  it('my-repo → 有効', () => {
    expect(validateRepoName('my-repo')).toBeUndefined()
  })

  it('_private → 有効（アンダースコア始まり）', () => {
    expect(validateRepoName('_private')).toBeUndefined()
  })

  it('-bad → 無効（ハイフン始まり）', () => {
    expect(validateRepoName('-bad')).toBeDefined()
  })

  it('空文字 → 無効（必須）', () => {
    expect(validateRepoName('')).toBeDefined()
  })
})

describe('validateLicense', () => {
  it('MIT → 有効', () => {
    expect(validateLicense('MIT')).toBeUndefined()
  })

  it('Apache-2.0 → 有効', () => {
    expect(validateLicense('Apache-2.0')).toBeUndefined()
  })

  it('"MIT License" → 無効（空白）', () => {
    expect(validateLicense('MIT License')).toBeDefined()
  })

  it('空文字 → 無効（必須）', () => {
    expect(validateLicense('')).toBeDefined()
  })
})

import { describe, expect, it } from 'vitest'
import {
  validateLicense,
  validateOrgName,
  validateProjectName,
  validateRepoName,
} from '../src/validate.js'

describe('validateProjectName', () => {
  it('my-app → valid', () => {
    expect(validateProjectName('my-app')).toBeUndefined()
  })

  it('MyApp → invalid (uppercase)', () => {
    expect(validateProjectName('MyApp')).toBeDefined()
  })

  it('-bad-start → invalid (starts with a hyphen)', () => {
    expect(validateProjectName('-bad-start')).toBeDefined()
  })

  it('"has space" → invalid (whitespace)', () => {
    expect(validateProjectName('has space')).toBeDefined()
  })

  it(`${'a'.repeat(215)} → invalid (215 characters)`, () => {
    expect(validateProjectName('a'.repeat(215))).toBeDefined()
  })

  it(`${'a'.repeat(214)} → valid (214 characters)`, () => {
    expect(validateProjectName('a'.repeat(214))).toBeUndefined()
  })

  it('empty string → invalid (required)', () => {
    expect(validateProjectName('')).toBeDefined()
  })

  it('undefined → invalid (required)', () => {
    expect(validateProjectName(undefined)).toBeDefined()
  })
})

describe('validateOrgName', () => {
  it('book000 → valid', () => {
    expect(validateOrgName('book000')).toBeUndefined()
  })

  it('Book.000 → valid (uppercase and dots allowed)', () => {
    expect(validateOrgName('Book.000')).toBeUndefined()
  })

  it('"bad org!" → invalid (whitespace and symbols)', () => {
    expect(validateOrgName('bad org!')).toBeDefined()
  })

  it('empty string → invalid (required)', () => {
    expect(validateOrgName('')).toBeDefined()
  })
})

describe('validateRepoName', () => {
  it('my-repo → valid', () => {
    expect(validateRepoName('my-repo')).toBeUndefined()
  })

  it('_private → valid (leading underscore)', () => {
    expect(validateRepoName('_private')).toBeUndefined()
  })

  it('-bad → invalid (starts with a hyphen)', () => {
    expect(validateRepoName('-bad')).toBeDefined()
  })

  it('empty string → invalid (required)', () => {
    expect(validateRepoName('')).toBeDefined()
  })
})

describe('validateLicense', () => {
  it('MIT → valid', () => {
    expect(validateLicense('MIT')).toBeUndefined()
  })

  it('Apache-2.0 → valid', () => {
    expect(validateLicense('Apache-2.0')).toBeUndefined()
  })

  it('"MIT License" → invalid (whitespace)', () => {
    expect(validateLicense('MIT License')).toBeDefined()
  })

  it('empty string → invalid (required)', () => {
    expect(validateLicense('')).toBeDefined()
  })
})

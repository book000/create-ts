/**
 * Smoke tests for the base variant.
 *
 * Checks basic TypeScript features and Node.js built-in behavior.
 * Does not connect to external services.
 */

describe('TypeScript basics', () => {
  it('async/await works', async () => {
    const delay = (ms: number): Promise<string> =>
      new Promise((resolve) => setTimeout(() => resolve('ok'), ms))

    const result = await delay(0)
    expect(result).toBe('ok')
  })

  it('generics work', () => {
    function identity<T>(value: T): T {
      return value
    }
    expect(identity(42)).toBe(42)
    expect(identity('hello')).toBe('hello')
  })

  it('throwing and catching an Error works', async () => {
    const failingFn = async (): Promise<never> => {
      throw new Error('test error')
    }

    await expect(failingFn()).rejects.toThrow('test error')
  })
})

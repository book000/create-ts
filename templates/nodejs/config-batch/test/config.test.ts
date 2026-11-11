/**
 * Tests for the config-batch variant.
 *
 * Checks that ConfigFramework from @book000/node-utils can be subclassed and that the validation logic works as expected.
 * Does not connect to external services.
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { ConfigFramework } from '@book000/node-utils'

/** Configuration interface for tests. */
interface TestConfig {
  apiKey: string
  timeout: number
}

/** ConfigFramework implementation for tests. */
class TestConfiguration extends ConfigFramework<TestConfig> {
  protected validates(): Record<string, (config: TestConfig) => boolean> {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      'apiKey is required': (config) => config.apiKey !== undefined,
      'apiKey is string': (config) => typeof config.apiKey === 'string',
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      'timeout is required': (config) => config.timeout !== undefined,
      'timeout is positive number': (config) =>
        typeof config.timeout === 'number' && config.timeout > 0,
    }
  }
}

describe('ConfigFramework', () => {
  let tmpDir: string
  let configPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'node-utils-test-'))
    configPath = path.join(tmpDir, 'config.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('can define a subclass', () => {
    fs.writeFileSync(configPath, JSON.stringify({ apiKey: 'test', timeout: 30 }))
    const config = new TestConfiguration(configPath)
    expect(config).toBeDefined()
  })

  it('accepts a valid configuration', () => {
    fs.writeFileSync(
      configPath,
      JSON.stringify({ apiKey: 'test-key', timeout: 30 })
    )
    const config = new TestConfiguration(configPath)
    config.load()
    expect(config.validate()).toBe(true)
    expect(config.getValidateFailures()).toHaveLength(0)
  })

  it('detects an invalid configuration (negative timeout)', () => {
    fs.writeFileSync(
      configPath,
      JSON.stringify({ apiKey: 'test-key', timeout: -1 })
    )
    const config = new TestConfiguration(configPath)
    config.load()
    expect(config.validate()).toBe(false)
    expect(config.getValidateFailures().length).toBeGreaterThan(0)
    expect(config.getValidateFailures()).toContain('timeout is positive number')
  })
})

import { ConfigFramework } from '@book000/node-utils'
import { ConfigInterface } from './config'

/**
 * Configuration framework implementation.
 */
class Configuration extends ConfigFramework<ConfigInterface> {
  /**
   * Returns the validation rules.
   */
  protected validates(): Record<string, (config: ConfigInterface) => boolean> {
    return {
      // TODO: add validation rules
      // e.g. 'someKey is required': (config) => config.someKey !== undefined,
    }
  }
}

/**
 * Entry point.
 */
// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  const config = new Configuration('./data/config.json')
  config.load()
  if (!config.validate()) {
    throw new Error(
      `Configuration validation failed: ${config.getValidateFailures().join(', ')}`
    )
  }
  // TODO: read settings with config.get('key') and implement the batch logic
}

main().catch((error: unknown) => {
  console.error(error)
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})

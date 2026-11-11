import { Client } from 'discord.js'
import { ConfigFramework } from '@book000/node-utils'
import { ConfigInterface } from './config'

/**
 * Main class of the Discord bot.
 */
export class Discord {
  private readonly client: Client
  private readonly config: ConfigFramework<ConfigInterface>

  /**
   * @param client - Discord client
   * @param config - Configuration framework
   */
  constructor(client: Client, config: ConfigFramework<ConfigInterface>) {
    this.client = client
    this.config = config
  }

  /**
   * Returns the configuration framework.
   */
  protected getConfig(): ConfigFramework<ConfigInterface> {
    return this.config
  }

  /**
   * Called when the bot is ready.
   */
  public onReady(): void {
    console.log(`Logged in as ${this.client.user?.tag ?? 'unknown'}`)
    // TODO: read settings with this.getConfig().get('key') and implement the bot's behavior
  }
}

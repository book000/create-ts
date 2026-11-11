/**
 * Tests for the discord-bot variant.
 *
 * Checks that the discord.js Client can be initialized and the basic behavior of the Discord class.
 * Does not log in with a real token.
 */

import { Client, GatewayIntentBits } from 'discord.js'
import { Discord } from '../src/discord'
import type { ConfigFramework } from '@book000/node-utils'
import type { ConfigInterface } from '../src/config'

/** Mock ConfigFramework for tests. */
const createMockConfig = (): ConfigFramework<ConfigInterface> =>
  ({
    get: jest.fn(),
    load: jest.fn(),
    validate: jest.fn().mockReturnValue(true),
    getValidateFailures: jest.fn().mockReturnValue([]),
  }) as unknown as ConfigFramework<ConfigInterface>

describe('Discord class', () => {
  let client: Client

  beforeEach(() => {
    client = new Client({ intents: [GatewayIntentBits.Guilds] })
  })

  afterEach(() => {
    client.destroy()
  })

  it('can create a Discord instance', () => {
    const mockConfig = createMockConfig()
    const discord = new Discord(client, mockConfig)
    expect(discord).toBeDefined()
  })

  it('can call onReady()', () => {
    const mockConfig = createMockConfig()
    const discord = new Discord(client, mockConfig)
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    expect(() => discord.onReady()).not.toThrow()

    consoleSpy.mockRestore()
  })
})

describe('discord.js Client', () => {
  it('can create a Client instance', () => {
    const testClient = new Client({ intents: [GatewayIntentBits.Guilds] })
    expect(testClient).toBeDefined()
    testClient.destroy()
  })

  it('can set multiple intents', () => {
    const testClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    })
    expect(testClient).toBeDefined()
    testClient.destroy()
  })
})

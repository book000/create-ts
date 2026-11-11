/**
 * Tests for the fastify variant.
 *
 * Checks that Fastify and @fastify/cors work.
 * Requests are injected with inject() instead of binding a real port.
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'

describe('Fastify application', () => {
  it('can create a Fastify instance', () => {
    const app = Fastify()
    expect(app).toBeDefined()
    void app.close()
  })

  it('can register @fastify/cors', async () => {
    const app = Fastify()
    await app.register(cors, { origin: false })
    expect(app).toBeDefined()
    await app.close()
  })

  it('GET / returns 200', async () => {
    const app = Fastify()
    await app.register(cors, { origin: false })

    app.get('/', async (_request, _reply) => {
      return { status: 'ok' }
    })

    const response = await app.inject({ method: 'GET', url: '/' })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' })

    await app.close()
  })

  it('returns 404 for an unknown route', async () => {
    const app = Fastify()
    await app.register(cors, { origin: false })

    const response = await app.inject({ method: 'GET', url: '/nonexistent' })
    expect(response.statusCode).toBe(404)

    await app.close()
  })
})

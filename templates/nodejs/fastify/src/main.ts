import Fastify from 'fastify'
import cors from '@fastify/cors'
// fastify-raw-body is for when the raw POST body is needed (e.g. webhook signature verification)
// import fastifyRawBody from 'fastify-raw-body'

/** Fastify instance. */
const fastify = Fastify({
  logger: true,
})

/**
 * Entry point.
 */
async function main(): Promise<void> {
  await fastify.register(cors, {
    // TODO: in production, set the allowed origins explicitly (e.g. origin: 'https://example.com')
    origin: false,
  })

  // Enable the following to use fastify-raw-body
  // await fastify.register(fastifyRawBody)

  fastify.get('/', (): { status: string } => {
    return { status: 'ok' }
  })

  await fastify.listen({ port: 3000, host: '0.0.0.0' })
}

main().catch((error: unknown) => {
  fastify.log.error(error)
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})

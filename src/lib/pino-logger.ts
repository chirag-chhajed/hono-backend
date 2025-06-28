import { pinoLogger as logger } from 'hono-pino'
import pino from 'pino'
import pretty from 'pino-pretty'

export function pinoLogger() {
  return logger({
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line ts/no-unsafe-assignment, node/prefer-global/process
    pino: pino(process.env.NODE_ENV === 'production' ? undefined : pretty()),
    http: {
      reqId: () => crypto.randomUUID(),
    },
  })
}

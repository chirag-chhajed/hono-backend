import type { z } from '@hono/zod-openapi'

export type ZodSchema =
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-ignore
  z.ZodUnion | z.AnyZodObject | z.ZodArray<z.AnyZodObject>

export function jsonContent<T extends ZodSchema>(
  schema: T,
  description: string,
) {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
    description,
  }
}

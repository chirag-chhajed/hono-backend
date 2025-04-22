/* eslint-disable node/prefer-global/process */

import { createEnv } from '@t3-oss/env-core';
// import { config } from 'dotenv';
// import { expand } from 'dotenv-expand';
import { z } from 'zod';

// expand(config());
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    FIREBASE_CLIENT_EMAIL: z.string().email(),
    FIREBASE_PRIVATE_KEY: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    JWT_ACCESS_SECRET_KEY: z.string().min(1),
    JWT_REFRESH_SECRET_KEY: z.string().min(1),
    MY_AWS_ACCESS_KEY_ID: z.string().min(1),
    MY_AWS_SECRET_ACCESS_KEY: z.string().min(1),
    MY_AWS_REGION: z.string().min(1),
    MY_S3_BUCKET_NAME: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const envVariables = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  JWT_ACCESS_SECRET_KEY: z.string().min(1),
  JWT_REFRESH_SECRET_KEY: z.string().min(1),
  MY_AWS_ACCESS_KEY_ID: z.string().min(1),
  MY_AWS_SECRET_ACCESS_KEY: z.string().min(1),
  MY_AWS_REGION: z.string().min(1),
  MY_S3_BUCKET_NAME: z.string().min(1),
});

envVariables.parse(process.env);
declare global {
  // eslint-disable-next-line ts/no-namespace
  namespace NodeJS {
     
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line ts/consistent-type-definitions
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

import { S3Client } from '@aws-sdk/client-s3'

import { env } from '@/env.js'

const s3Client = new S3Client({
  region: env.MY_AWS_REGION,
  credentials: {
    accessKeyId: env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: env.MY_AWS_SECRET_ACCESS_KEY,
  },
})

export { s3Client }

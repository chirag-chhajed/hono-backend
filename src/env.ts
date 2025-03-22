import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

expand(config());
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.coerce.number().default(3000),
    FIREBASE_CLIENT_EMAIL: z.string().email(),
    FIREBASE_PRIVATE_KEY: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    JWT_ACCESS_SECRET_KEY: z.string().min(1),
    JWT_REFRESH_SECRET_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const envVariables = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  JWT_ACCESS_SECRET_KEY: z.string().min(1),
  JWT_REFRESH_SECRET_KEY: z.string().min(1),
});

envVariables.parse(process.env);
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

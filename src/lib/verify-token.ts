import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { env } from "@/env.js";

const firebaseAdmin = initializeApp({
  credential: cert({
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    projectId: env.FIREBASE_PROJECT_ID,
  }),
});

export const verifyIdToken = async (idToken: string) =>
  getAuth(firebaseAdmin).verifyIdToken(idToken);

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const config = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }
export const firebaseConfigured = Object.values(config).every(Boolean)
export const firebaseApp = firebaseConfigured ? (getApps()[0] ?? initializeApp(config)) : null
export async function getFirebaseAuth() {
  if (!firebaseApp) throw new Error('Firebase is not configured')
  const { browserLocalPersistence, initializeAuth } = await import('firebase/auth')
  return initializeAuth(firebaseApp, { persistence: browserLocalPersistence })
}
export async function getFirestoreDb() {
  if (!firebaseApp) throw new Error('Firebase is not configured')
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(firebaseApp)
}

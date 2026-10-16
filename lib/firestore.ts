import { getFirestoreDb } from './firebase'
import type { Goal, Transaction, UserPreferences } from './models'

export type UserData = {
  transactions: Transaction[]
  goals: Goal[]
  preferences: UserPreferences
}

export const emptyUserData: UserData = {
  transactions: [],
  goals: [],
  preferences: { investmentPct: 30, theme: 'system', currency: 'UGX' },
}

export function subscribeToUserData(uid: string, onData: (data: UserData) => void, onError: (error: Error) => void) {
  let cancelled = false
  let unsubscribe: () => void = () => undefined
  void getFirestoreDb().then(async (database) => {
    if (cancelled) return
    const { doc, onSnapshot } = await import('firebase/firestore')
    unsubscribe = onSnapshot(doc(database, 'users', uid, 'app', 'data'), (snapshot) => {
      const value = snapshot.data() as Partial<UserData> | undefined
      onData({ ...emptyUserData, ...value, transactions: value?.transactions ?? [], goals: value?.goals ?? [], preferences: { ...emptyUserData.preferences, ...value?.preferences } })
    }, onError)
  }).catch(onError)
  return () => { cancelled = true; unsubscribe() }
}

export async function saveUserData(uid: string, data: UserData) {
  const database = await getFirestoreDb()
  const { doc, setDoc } = await import('firebase/firestore')
  await setDoc(doc(database, 'users', uid, 'app', 'data'), data, { merge: true })
}

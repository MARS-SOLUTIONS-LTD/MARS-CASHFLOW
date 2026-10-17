import { serverTimestamp, collection, addDoc, doc, getDoc } from 'firebase/firestore'
import { getFirestoreDb } from '../firebase'
import { splitIncome, DEFAULT_ALLOCATION, assertValidConfig } from '@/lib/finance/allocation'
import type { AllocationConfig } from '@/lib/finance/allocation'

export async function addIncome(input: {
  userId: string
  amount: number
  currency: string
  source: string
  date: string
  description?: string
}) {
  if (!input || !input.userId) throw new Error('Missing userId')
  if (typeof input.amount !== 'number' || input.amount <= 0) throw new Error('Amount must be a positive number')

  const db = await getFirestoreDb()

  let config: AllocationConfig = DEFAULT_ALLOCATION
  let planId: string | undefined

  try {
    const userRef = doc(db, 'users', input.userId)
    const snap = await getDoc(userRef)
    const profile = snap.exists() ? (snap.data() as any) : undefined
    planId = profile?.activeAllocationId

    if (planId) {
      const planRef = doc(db, 'users', input.userId, 'allocationPlans', planId)
      const planSnap = await getDoc(planRef)
      if (planSnap.exists()) {
        const maybeConfig = planSnap.data()?.config as AllocationConfig | undefined
        if (maybeConfig) {
          try {
            assertValidConfig(maybeConfig)
            config = maybeConfig
          } catch (err) {
            console.warn('Invalid allocation config in plan', planId, err)
            config = DEFAULT_ALLOCATION
          }
        } else {
          console.warn('Allocation plan missing config, falling back to default', planId)
          config = DEFAULT_ALLOCATION
        }
      } else {
        console.warn('Allocation plan not found, falling back to default', planId)
        config = DEFAULT_ALLOCATION
      }
    }
  } catch (err) {
    console.warn('Error loading allocation plan, falling back to default allocation', err)
    config = DEFAULT_ALLOCATION
  }

  let breakdown
  try {
    breakdown = splitIncome(input.amount, config)
  } catch (err) {
    throw new Error('Failed to compute allocation breakdown. Please try again later.')
  }

  const payload: any = {
    userId: input.userId,
    amount: input.amount,
    currency: input.currency,
    source: input.source,
    date: input.date,
    description: input.description ?? null,
    allocationSnapshot: config,
    breakdown: {
      investment: breakdown.investment,
      personal: breakdown.personal,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (planId) payload.allocationPlanId = planId

  const ref = await addDoc(collection(db, 'users', input.userId, 'incomes'), payload)
  return ref.id
}

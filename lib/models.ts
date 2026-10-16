export type TransactionType = 'income' | 'expense' | 'saving' | 'investment'
export type Transaction = { id: string; type: TransactionType; amount: number; title: string; date: string; category?: string }
export type Goal = { id: string; name: string; target: number; saved: number }
export type UserPreferences = { investmentPct: number; theme: 'light' | 'dark' | 'system'; currency: string }

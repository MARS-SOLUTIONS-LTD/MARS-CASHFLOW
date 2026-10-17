import type { Minor, Currency } from '@/lib/finance/money';
import type { AllocationConfig } from '@/lib/finance/allocation';

export type ISODate = string; // 'YYYY-MM-DD' — never a Date object in storage

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  currency: Currency;
  theme: 'light' | 'dark' | 'system';
  locale: string;
  mainGoal?: string;
  monthlyIncomeEstimate?: Minor;
  incomeFrequency?: 'daily' | 'weekly' | 'monthly' | 'irregular' | 'other';
  activeAllocationId: string;
  createdAt: string;
  onboardedAt?: string;
}

export interface AllocationPlan {
  id: string;
  userId: string;
  config: AllocationConfig;
  /** Monotonic revision number, starting at 1. */
  revision: number;
  /** If set, this revision supersedes `supersedesId`. */
  supersedesId?: string;
  isActive: boolean;
  note?: string;
  createdAt: string;
}

export interface IncomeRecord {
  id: string;
  userId: string;
  amount: Minor;
  currency: Currency;
  source: string;
  date: ISODate;
  description?: string;
  tags?: string[];
  frequency?: UserProfile['incomeFrequency'];
  /** Snapshot of the allocation plan applied at creation. */
  allocationPlanId: string;
  allocationSnapshot: AllocationConfig;
  breakdown: {
    investment: Minor;
    personal: { needs: Minor; savings: Minor; wants: Minor; selfGrowth: Minor };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  userId: string;
  amount: Minor;
  currency: Currency;
  categoryId: string;
  date: ISODate;
  description?: string;
  merchant?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: Minor;
  targetDate?: ISODate;
  createdAt: string;
  archived: boolean;
}

export interface SavingsContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: Minor;
  date: ISODate;
  destination?: string;
  description?: string;
  createdAt: string;
}

export interface InvestmentRecord {
  id: string;
  userId: string;
  amount: Minor;              // contributed
  name: string;
  provider: string;
  date: ISODate;
  type: string;               // 'bonds' | 'stocks' | 'mmf' | 'real-estate' | ...
  accountRef?: string;
  notes?: string;
  createdAt: string;
}

export interface InvestmentValuation {
  id: string;
  userId: string;
  investmentId: string;
  estimatedValue: Minor;
  valuationDate: ISODate;
  source: 'user-entered';
  notes?: string;
  createdAt: string;
}

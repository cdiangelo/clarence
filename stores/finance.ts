import { create } from 'zustand';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type GoalType = 'save' | 'invest' | 'pay_debt' | 'emergency_fund' | 'purchase';

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  current: number;
  deadline?: string;
}

interface FinanceStore {
  expenses: Expense[];
  goals: FinancialGoal[];
  monthlyBudget?: number;
  logExpense: (expense: Omit<Expense, 'id'>) => void;
  setGoal: (goal: Omit<FinancialGoal, 'id'>) => string;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => void;
  setBudget: (monthly: number) => void;
  getMonthExpenses: () => Expense[];
  getMonthTotal: () => number;
}

function isSameMonth(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  expenses: [],
  goals: [],
  monthlyBudget: undefined,

  logExpense: (expense) =>
    set((s) => ({
      expenses: [{ ...expense, id: uid() }, ...s.expenses],
    })),

  setGoal: (goal) => {
    const id = uid();
    set((s) => ({ goals: [...s.goals, { ...goal, id }] }));
    return id;
  },

  updateGoal: (id, updates) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  setBudget: (monthly) => set({ monthlyBudget: monthly }),

  getMonthExpenses: () => get().expenses.filter((e) => isSameMonth(e.date)),

  getMonthTotal: () =>
    get()
      .expenses.filter((e) => isSameMonth(e.date))
      .reduce((sum, e) => sum + e.amount, 0),
}));

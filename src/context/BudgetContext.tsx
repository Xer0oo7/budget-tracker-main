
import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description: string;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BudgetState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
}

type BudgetAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_BUDGET'; payload: Budget }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'LOAD_DATA'; payload: BudgetState };

const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', icon: '🍽️', color: '#F59E0B' },
  { id: '2', name: 'Transportation', icon: '🚗', color: '#3B82F6' },
  { id: '3', name: 'Shopping', icon: '🛍️', color: '#EF4444' },
  { id: '4', name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { id: '5', name: 'Bills & Utilities', icon: '⚡', color: '#10B981' },
  { id: '6', name: 'Healthcare', icon: '🏥', color: '#F97316' },
  { id: '7', name: 'Salary', icon: '💰', color: '#059669' },
  { id: '8', name: 'Freelance', icon: '💼', color: '#0891B2' },
  { id: '9', name: 'Other', icon: '📦', color: '#6B7280' },
];

const initialState: BudgetState = {
  transactions: [],
  budgets: [],
  categories: defaultCategories,
};

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_BUDGET':
      return {
        ...state,
        budgets: state.budgets.some(b => b.category === action.payload.category)
          ? state.budgets.map(b =>
              b.category === action.payload.category ? action.payload : b
            )
          : [...state.budgets, action.payload],
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

interface BudgetContextType {
  state: BudgetState;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (budget: Budget) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  calculateTotalIncome: () => number;
  calculateTotalExpenses: () => number;
  calculateBalance: () => number;
  getExpensesByCategory: () => { [key: string]: number };
  getBudgetProgress: (category: string) => number;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('budgetData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('budgetData', JSON.stringify(state));
  }, [state]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
  };

  const updateTransaction = (transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  };

  const deleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };

  const setBudget = (budget: Budget) => {
    dispatch({ type: 'SET_BUDGET', payload: budget });
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
  };

  const calculateTotalIncome = () => {
    return state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateTotalExpenses = () => {
    return state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateBalance = () => {
    return calculateTotalIncome() - calculateTotalExpenses();
  };

  const getExpensesByCategory = () => {
    const expenses = state.transactions.filter(t => t.type === 'expense');
    return expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });
  };

  const getBudgetProgress = (category: string) => {
    const budget = state.budgets.find(b => b.category === category);
    if (!budget) return 0;
    
    const spent = state.transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return Math.min((spent / budget.limit) * 100, 100);
  };

  const value: BudgetContextType = {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
    addCategory,
    calculateTotalIncome,
    calculateTotalExpenses,
    calculateBalance,
    getExpensesByCategory,
    getBudgetProgress,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}

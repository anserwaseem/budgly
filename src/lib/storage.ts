import { Transaction, PaymentMode } from './types';

const TRANSACTIONS_KEY = 'budgeter_transactions';
const MODES_KEY = 'budgeter_payment_modes';
const THEME_KEY = 'budgeter_theme';

const DEFAULT_MODES: PaymentMode[] = [
  { id: '1', name: 'Cash', shorthand: 'C' },
  { id: '2', name: 'Credit Card', shorthand: 'CC' },
  { id: '3', name: 'Debit', shorthand: 'D' },
];

export function getTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function addTransaction(transaction: Transaction): Transaction[] {
  const transactions = getTransactions();
  const updated = [transaction, ...transactions];
  saveTransactions(updated);
  return updated;
}

export function deleteTransaction(id: string): Transaction[] {
  const transactions = getTransactions();
  const updated = transactions.filter(t => t.id !== id);
  saveTransactions(updated);
  return updated;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction[] {
  const transactions = getTransactions();
  const updated = transactions.map(t => (t.id === id ? { ...t, ...updates } : t));
  saveTransactions(updated);
  return updated;
}

export function getPaymentModes(): PaymentMode[] {
  try {
    const data = localStorage.getItem(MODES_KEY);
    return data ? JSON.parse(data) : DEFAULT_MODES;
  } catch {
    return DEFAULT_MODES;
  }
}

export function savePaymentModes(modes: PaymentMode[]): void {
  localStorage.setItem(MODES_KEY, JSON.stringify(modes));
}

export function getTheme(): 'light' | 'dark' {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(THEME_KEY, theme);
}

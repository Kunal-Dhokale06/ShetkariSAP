export type Language = 'mr' | 'hi' | 'en';

export interface Profile {
  id: string;
  name: string;
  mobile: string;
  village: string;
  taluka: string;
  district: string;
}

export interface Farm {
  id: string;
  name: string;
  area: number;
  location: string;
  createdAt: string;
}

export type Season = 'kharif' | 'rabi' | 'zaid';
export type CropStatus = 'active' | 'harvested' | 'failed';

export interface Crop {
  id: string;
  farmId: string;
  name: string;
  season: Season;
  plantDate: string;
  expectedHarvestDate: string;
  area: number;
  status: CropStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'seeds'
  | 'fertilizer'
  | 'pesticides'
  | 'labor'
  | 'irrigation'
  | 'equipment'
  | 'transport'
  | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'seeds', 'fertilizer', 'pesticides', 'labor',
  'irrigation', 'equipment', 'transport', 'other',
];

export interface Expense {
  id: string;
  cropId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
}

export type SaleUnit = 'kg' | 'quintal' | 'ton' | 'piece' | 'dozen';
export const SALE_UNITS: SaleUnit[] = ['kg', 'quintal', 'ton', 'piece', 'dozen'];

export interface Sale {
  id: string;
  cropId: string;
  buyerName: string;
  quantity: number;
  unit: SaleUnit;
  pricePerUnit: number;
  totalAmount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface CropSummary {
  crop: Crop;
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
}

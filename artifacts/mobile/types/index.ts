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

export type ReceiptType = 'expense' | 'sale';
export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReceiptScan {
  id: string;
  type: ReceiptType;
  originalUri: string;
  enhancedUri: string | null;
  status: ScanStatus;
  createdAt: string;
  parsedData?: Record<string, unknown>;
  confidence: number;
  notes?: string;
}

export type BudgetCategory =
  | 'landPreparation'
  | 'seeds'
  | 'seedTreatment'
  | 'nursery'
  | 'fertilizer'
  | 'organicInputs'
  | 'micronutrients'
  | 'herbicides'
  | 'pesticides'
  | 'fungicides'
  | 'irrigation'
  | 'electricity'
  | 'diesel'
  | 'machinery'
  | 'labor'
  | 'harvesting'
  | 'packaging'
  | 'transport'
  | 'miscellaneous'
  | 'contingency';

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  'landPreparation',
  'seeds',
  'seedTreatment',
  'nursery',
  'fertilizer',
  'organicInputs',
  'micronutrients',
  'herbicides',
  'pesticides',
  'fungicides',
  'irrigation',
  'electricity',
  'diesel',
  'machinery',
  'labor',
  'harvesting',
  'packaging',
  'transport',
  'miscellaneous',
  'contingency',
];

export interface BudgetLineItem {
  id: string;
  category: BudgetCategory;
  label: string;
  estimatedAmount: number;
  actualAmount?: number;
  notes?: string;
}

export type BudgetStatus = 'draft' | 'active' | 'completed';

export interface Budget {
  id: string;
  farmId: string;
  cropId: string;
  variety: string;
  season: Season;
  area: number;
  irrigationType: string;
  method: string;
  title: string;
  lineItems: BudgetLineItem[];
  totalEstimatedCost: number;
  expectedRevenue: number;
  expectedProfit: number;
  roi: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  farmId: string | null;
  cropId: string | null;
  season: Season | null;
  fromDate: string | null;
  toDate: string | null;
  generatedAt: string;
  metadata: Record<string, unknown>;
  pdfUri?: string;
}

export interface CropSummary {
  crop: Crop;
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
}

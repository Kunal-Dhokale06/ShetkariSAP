import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import type {
  Budget,
  Crop,
  CropStatus,
  Expense,
  Farm,
  Language,
  Profile,
  ReceiptScan,
  Report,
  Sale,
} from '@/types';

const KEYS = {
  PROFILE: '@kisan/profile',
  FARMS: '@kisan/farms',
  CROPS: '@kisan/crops',
  EXPENSES: '@kisan/expenses',
  SALES: '@kisan/sales',
  RECEIPTS: '@kisan/receipts',
  BUDGETS: '@kisan/budgets',
  REPORTS: '@kisan/reports',
  LANGUAGE: '@kisan/language',
  PHONE: '@kisan/verified_phone',
};

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface AppContextType {
  isLoaded: boolean;
  profile: Profile | null;
  farms: Farm[];
  crops: Crop[];
  expenses: Expense[];
  sales: Sale[];
  receipts: ReceiptScan[];
  budgets: Budget[];
  reports: Report[];
  language: Language;

  saveProfile: (p: Profile, farmName: string, farmArea: number) => Promise<void>;
  updateProfile: (p: Profile) => Promise<void>;

  addCrop: (crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Crop>;
  updateCrop: (crop: Crop) => Promise<void>;
  deleteCrop: (id: string) => Promise<void>;

  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addSale: (s: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;
  updateSale: (s: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  addReceiptScan: (scan: Omit<ReceiptScan, 'id' | 'createdAt'>) => Promise<ReceiptScan>;
  updateReceiptScan: (scan: ReceiptScan) => Promise<void>;

  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addReport: (report: Omit<Report, 'id' | 'generatedAt'>) => Promise<Report>;
  updateReport: (report: Report) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;

  setLanguage: (lang: Language) => Promise<void>;
  verifiedPhone: string | null;
  setVerifiedPhone: (phone: string) => Promise<void>;

  getCropExpenses: (cropId: string) => Expense[];
  getCropSales: (cropId: string) => Sale[];
  getCropTotals: (cropId: string) => { investment: number; revenue: number; netProfit: number };
  getTotals: () => { investment: number; revenue: number; profit: number; activeCrops: number };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [receipts, setReceipts] = useState<ReceiptScan[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [language, setLanguageState] = useState<Language>('mr');
  const [verifiedPhone, setVerifiedPhoneState] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      try {
        const [lang, profileStr, farmsStr, cropsStr, expensesStr, salesStr, receiptsStr, budgetsStr, reportsStr, phoneStr] =
          await AsyncStorage.multiGet([
            KEYS.LANGUAGE, KEYS.PROFILE, KEYS.FARMS,
            KEYS.CROPS, KEYS.EXPENSES, KEYS.SALES, KEYS.RECEIPTS,
            KEYS.BUDGETS, KEYS.REPORTS, KEYS.PHONE,
          ]);

        const savedLang = (lang[1] as Language) || 'mr';
        setLanguageState(savedLang);
        await i18n.changeLanguage(savedLang);

        if (profileStr[1]) setProfile(JSON.parse(profileStr[1]));
        if (farmsStr[1]) setFarms(JSON.parse(farmsStr[1]));
        if (cropsStr[1]) setCrops(JSON.parse(cropsStr[1]));
        if (expensesStr[1]) setExpenses(JSON.parse(expensesStr[1]));
        if (salesStr[1]) setSales(JSON.parse(salesStr[1]));
        if (receiptsStr[1]) setReceipts(JSON.parse(receiptsStr[1]));
        if (budgetsStr[1]) setBudgets(JSON.parse(budgetsStr[1]));
        if (reportsStr[1]) setReports(JSON.parse(reportsStr[1]));
        if (phoneStr[1]) setVerifiedPhoneState(phoneStr[1]);
      } catch {
        // ignore parse errors
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (key: string, value: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }, []);

  // Profile
  const saveProfile = useCallback(async (p: Profile, farmName: string, farmArea: number) => {
    const newProfile = { ...p, id: generateId() };
    const newFarm: Farm = {
      id: generateId(),
      name: farmName,
      area: farmArea,
      location: `${p.village}, ${p.district}`,
      createdAt: new Date().toISOString(),
    };
    setProfile(newProfile);
    setFarms([newFarm]);
    await persist(KEYS.PROFILE, newProfile);
    await persist(KEYS.FARMS, [newFarm]);
  }, [persist]);

  const updateProfile = useCallback(async (p: Profile) => {
    setProfile(p);
    await persist(KEYS.PROFILE, p);
  }, [persist]);

  // Crops
  const addCrop = useCallback(async (cropData: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newCrop: Crop = { ...cropData, id: generateId(), createdAt: now, updatedAt: now };
    setCrops(prev => {
      const updated = [newCrop, ...prev];
      persist(KEYS.CROPS, updated);
      return updated;
    });
    return newCrop;
  }, [persist]);

  const updateCrop = useCallback(async (crop: Crop) => {
    const updated = { ...crop, updatedAt: new Date().toISOString() };
    setCrops(prev => {
      const list = prev.map(c => c.id === crop.id ? updated : c);
      persist(KEYS.CROPS, list);
      return list;
    });
  }, [persist]);

  const deleteCrop = useCallback(async (id: string) => {
    setCrops(prev => {
      const list = prev.filter(c => c.id !== id);
      persist(KEYS.CROPS, list);
      return list;
    });
    setExpenses(prev => {
      const list = prev.filter(e => e.cropId !== id);
      persist(KEYS.EXPENSES, list);
      return list;
    });
    setSales(prev => {
      const list = prev.filter(s => s.cropId !== id);
      persist(KEYS.SALES, list);
      return list;
    });
  }, [persist]);

  // Expenses
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = { ...expenseData, id: generateId(), createdAt: new Date().toISOString() };
    setExpenses(prev => {
      const updated = [newExpense, ...prev];
      persist(KEYS.EXPENSES, updated);
      return updated;
    });
    return newExpense;
  }, [persist]);

  const updateExpense = useCallback(async (expense: Expense) => {
    setExpenses(prev => {
      const list = prev.map(e => e.id === expense.id ? expense : e);
      persist(KEYS.EXPENSES, list);
      return list;
    });
  }, [persist]);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => {
      const list = prev.filter(e => e.id !== id);
      persist(KEYS.EXPENSES, list);
      return list;
    });
  }, [persist]);

  // Sales
  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = { ...saleData, id: generateId(), createdAt: new Date().toISOString() };
    setSales(prev => {
      const updated = [newSale, ...prev];
      persist(KEYS.SALES, updated);
      return updated;
    });
    return newSale;
  }, [persist]);

  const updateSale = useCallback(async (sale: Sale) => {
    setSales(prev => {
      const list = prev.map(s => s.id === sale.id ? sale : s);
      persist(KEYS.SALES, list);
      return list;
    });
  }, [persist]);

  const deleteSale = useCallback(async (id: string) => {
    setSales(prev => {
      const list = prev.filter(s => s.id !== id);
      persist(KEYS.SALES, list);
      return list;
    });
  }, [persist]);

  const addReceiptScan = useCallback(async (scanData: Omit<ReceiptScan, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newScan: ReceiptScan = { ...scanData, id: generateId(), createdAt: now };
    setReceipts(prev => {
      const updated = [newScan, ...prev];
      persist(KEYS.RECEIPTS, updated);
      return updated;
    });
    return newScan;
  }, [persist]);

  const updateReceiptScan = useCallback(async (scan: ReceiptScan) => {
    setReceipts(prev => {
      const list = prev.map(item => (item.id === scan.id ? scan : item));
      persist(KEYS.RECEIPTS, list);
      return list;
    });
  }, [persist]);

  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newBudget: Budget = { ...budgetData, id: generateId(), createdAt: now, updatedAt: now };
    setBudgets(prev => {
      const updated = [newBudget, ...prev];
      persist(KEYS.BUDGETS, updated);
      return updated;
    });
    return newBudget;
  }, [persist]);

  const updateBudget = useCallback(async (budget: Budget) => {
    setBudgets(prev => {
      const list = prev.map(item => (item.id === budget.id ? budget : item));
      persist(KEYS.BUDGETS, list);
      return list;
    });
  }, [persist]);

  const deleteBudget = useCallback(async (id: string) => {
    setBudgets(prev => {
      const list = prev.filter(item => item.id !== id);
      persist(KEYS.BUDGETS, list);
      return list;
    });
  }, [persist]);

  const addReport = useCallback(async (reportData: Omit<Report, 'id' | 'generatedAt'>) => {
    const newReport: Report = { ...reportData, id: generateId(), generatedAt: new Date().toISOString() };
    setReports(prev => {
      const updated = [newReport, ...prev];
      persist(KEYS.REPORTS, updated);
      return updated;
    });
    return newReport;
  }, [persist]);

  const updateReport = useCallback(async (report: Report) => {
    setReports(prev => {
      const list = prev.map(item => (item.id === report.id ? report : item));
      persist(KEYS.REPORTS, list);
      return list;
    });
  }, [persist]);

  const deleteReport = useCallback(async (id: string) => {
    setReports(prev => {
      const list = prev.filter(item => item.id !== id);
      persist(KEYS.REPORTS, list);
      return list;
    });
  }, [persist]);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
  }, []);

  const setVerifiedPhone = useCallback(async (phone: string) => {
    setVerifiedPhoneState(phone);
    await AsyncStorage.setItem(KEYS.PHONE, phone);
  }, []);

  // Computed helpers
  const getCropExpenses = useCallback((cropId: string) =>
    expenses.filter(e => e.cropId === cropId), [expenses]);

  const getCropSales = useCallback((cropId: string) =>
    sales.filter(s => s.cropId === cropId), [sales]);

  const getCropTotals = useCallback((cropId: string) => {
    const investment = expenses.filter(e => e.cropId === cropId).reduce((s, e) => s + e.amount, 0);
    const revenue = sales.filter(s => s.cropId === cropId).reduce((s, sale) => s + sale.totalAmount, 0);
    return { investment, revenue, netProfit: revenue - investment };
  }, [expenses, sales]);

  const getTotals = useCallback(() => {
    const investment = expenses.reduce((s, e) => s + e.amount, 0);
    const revenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
    const activeCrops = crops.filter(c => c.status === 'active').length;
    return { investment, revenue, profit: revenue - investment, activeCrops };
  }, [expenses, sales, crops]);

  // Expose a stable markHarvested helper via updateCrop
  const value: AppContextType = {
    isLoaded,
    profile,
    farms,
    crops,
    expenses,
    sales,
    receipts,
    budgets,
    reports,
    language,
    verifiedPhone,
    setVerifiedPhone,
    saveProfile,
    updateProfile,
    addCrop,
    updateCrop,
    deleteCrop,
    addExpense,
    updateExpense,
    deleteExpense,
    addSale,
    updateSale,
    deleteSale,
    addReceiptScan,
    updateReceiptScan,
    addBudget,
    updateBudget,
    deleteBudget,
    addReport,
    updateReport,
    deleteReport,
    setLanguage,
    getCropExpenses,
    getCropSales,
    getCropTotals,
    getTotals,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Helper for marking a crop's status
export function useMarkCropStatus() {
  const { updateCrop } = useApp();
  return (crop: Crop, status: CropStatus) =>
    updateCrop({ ...crop, status });
}

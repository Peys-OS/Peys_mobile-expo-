import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#FF9500' },
  { id: 'transport', name: 'Transportation', icon: 'car', color: '#007AFF' },
  { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#FF2D55' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#5856D6' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#FF3B30' },
  { id: 'health', name: 'Health & Fitness', icon: 'heart', color: '#34C759' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#00C7BE' },
  { id: 'education', name: 'Education', icon: 'book', color: '#FFCC00' },
  { id: 'groceries', name: 'Groceries', icon: 'cart', color: '#AF52DE' },
  { id: 'other', name: 'Other', icon: 'ellipsis', color: '#8E8E93' },
];

interface SpendingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryUsage {
  categoryId: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

interface CategoryConfig {
  customCategories: SpendingCategory[];
  autoCategorize: boolean;
  defaultCategory: string;
}

const STORAGE_KEY = 'spending_categories';
const CONFIG_KEY = 'category_config';

export const SpendingCategories = {
  categories: [...DEFAULT_CATEGORIES] as SpendingCategory[],
  config: {
    customCategories: [],
    autoCategorize: true,
    defaultCategory: 'other',
  } as CategoryConfig,

  async loadCategories(): Promise<void> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const custom = JSON.parse(stored) as SpendingCategory[];
        this.categories = [...DEFAULT_CATEGORIES, ...custom];
      } catch {
        this.categories = [...DEFAULT_CATEGORIES];
      }
    }

    const configStored = await AsyncStorage.getItem(CONFIG_KEY);
    if (configStored) {
      try {
        this.config = JSON.parse(configStored);
      } catch {}
    }
  },

  async saveCategories(): Promise<void> {
    const custom = this.categories.filter(
      c => !DEFAULT_CATEGORIES.find(d => d.id === c.id)
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
  },

  configure(options: Partial<CategoryConfig>): void {
    this.config = { ...this.config, ...options };
  },

  getCategories(): SpendingCategory[] {
    return [...this.categories];
  },

  getCategoryById(id: string): SpendingCategory | undefined {
    return this.categories.find(c => c.id === id);
  },

  getDefaultCategories(): SpendingCategory[] {
    return [...DEFAULT_CATEGORIES];
  },

  async addCategory(category: Omit<SpendingCategory, 'id'>): Promise<SpendingCategory> {
    const id = `custom_${Date.now()}`;
    const newCategory: SpendingCategory = { ...category, id };
    
    this.categories.push(newCategory);
    this.config.customCategories.push(newCategory);
    await this.saveCategories();
    
    return newCategory;
  },

  async removeCategory(id: string): Promise<boolean> {
    if (DEFAULT_CATEGORIES.find(c => c.id === id)) {
      return false;
    }

    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.categories.splice(index, 1);
    this.config.customCategories = this.config.customCategories.filter(c => c.id !== id);
    await this.saveCategories();

    return true;
  },

  categorizeTransaction(memo?: string, recipient?: string): string {
    const searchText = `${memo || ''} ${recipient || ''}`.toLowerCase();

    const keywords: Record<string, string[]> = {
      food: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'doordash', 'uber eats'],
      transport: ['uber', 'lyft', 'gas', 'fuel', 'parking', 'transit', 'metro'],
      shopping: ['amazon', 'walmart', 'target', 'store', 'shop', 'mall'],
      bills: ['electric', 'water', 'internet', 'phone', 'bill', 'utility'],
      entertainment: ['netflix', 'spotify', 'movie', 'game', 'concert', 'hulu'],
      health: ['pharmacy', 'doctor', 'hospital', 'gym', 'medical', 'cvs', 'walgreens'],
      travel: ['airline', 'hotel', 'airbnb', 'booking', 'flight'],
      education: ['course', 'book', 'tutorial', 'Udemy', 'Coursera'],
      groceries: ['grocery', 'supermarket', 'whole foods', 'trader'],
    };

    for (const [categoryId, words] of Object.entries(keywords)) {
      if (words.some(word => searchText.includes(word))) {
        return categoryId;
      }
    }

    return this.config.defaultCategory;
  },

  calculateUsage(
    transactions: any[],
    categoryId: string
  ): CategoryUsage {
    const categoryTxs = transactions.filter(
      t => t.type === 'send' && (t as any).category === categoryId
    );

    const totalAmount = categoryTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalSent = transactions
      .filter(t => t.type === 'send')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      categoryId,
      totalAmount,
      transactionCount: categoryTxs.length,
      percentage: totalSent > 0 ? (totalAmount / totalSent) * 100 : 0,
    };
  },

  getAllCategoryUsage(transactions: any[]): CategoryUsage[] {
    return this.categories.map(cat => this.calculateUsage(transactions, cat.id));
  },

  getTopCategories(transactions: any[], limit: number = 5): SpendingCategory[] {
    const usage = this.getAllCategoryUsage(transactions);
    
    return usage
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit)
      .map(u => this.getCategoryById(u.categoryId))
      .filter(Boolean) as SpendingCategory[];
  },

  getCategoryColor(id: string): string {
    const category = this.getCategoryById(id);
    return category?.color || '#8E8E93';
  },

  getCategoryIcon(id: string): string {
    const category = this.getCategoryById(id);
    return category?.icon || 'ellipsis';
  },

  getCategoryName(id: string): string {
    const category = this.getCategoryById(id);
    return category?.name || 'Other';
  },

  getCategoryBreakdown(transactions: any[]): {
    category: SpendingCategory;
    amount: number;
    count: number;
    percentage: number;
  }[] {
    const usage = this.getAllCategoryUsage(transactions);
    const totalSent = transactions
      .filter(t => t.type === 'send')
      .reduce((sum, t) => sum + t.amount, 0);

    return usage
      .filter(u => u.totalAmount > 0)
      .map(u => {
        const cat = this.getCategoryById(u.categoryId);
        return {
          category: cat!,
          amount: u.totalAmount,
          count: u.transactionCount,
          percentage: totalSent > 0 ? (u.totalAmount / totalSent) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  },

  getMonthlyCategoryBreakdown(
    transactions: any[],
    month: Date
  ): { category: SpendingCategory; amount: number }[] {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const monthTxs = transactions.filter(t => {
      const txDate = new Date(t.created_at);
      return t.type === 'send' && txDate >= monthStart && txDate <= monthEnd;
    });

    return this.getCategoryBreakdown(monthTxs)
      .map(b => ({ category: b.category, amount: b.amount }))
      .filter(b => b.amount > 0);
  },

  resetToDefaults(): void {
    this.categories = [...DEFAULT_CATEGORIES];
    this.config = {
      customCategories: [],
      autoCategorize: true,
      defaultCategory: 'other',
    };
  },
};

export const getCategoryById = (id: string) => SpendingCategories.getCategoryById(id);
export const getAllCategories = () => SpendingCategories.getCategories();
export const categorizeTransaction = (memo?: string, recipient?: string) => 
  SpendingCategories.categorizeTransaction(memo, recipient);
export const getCategoryBreakdown = (transactions: any[]) => 
  SpendingCategories.getCategoryBreakdown(transactions);
// Feature permissions configuration
export const AVAILABLE_FEATURES = {
  // Core Features
  dashboard: { name: 'Business Overview', category: 'Core', required: true },
  
  // Inventory Management
  inventory: { name: 'Inventory Management', category: 'Inventory Management' },
  purchases: { name: 'Purchase Orders', category: 'Inventory Management' },
  
  // Sales & POS
  pos: { name: 'Point of Sale (POS)', category: 'Bills & Purchase Records' },
  bills: { name: 'Bills & Invoicing', category: 'Bills & Purchase Records' },
  
  // Customer Management
  customers: { name: 'Customer Management', category: 'Customer Management' },
  
  // HR & Staff Management
  hr: { name: 'Staff Management', category: 'HR & Staff Management' },
  commission: { name: 'Commission Management', category: 'HR & Staff Management' },
  leaves: { name: 'Leave Management', category: 'HR & Staff Management' },
  salary: { name: 'Salary Management', category: 'HR & Staff Management' },
  
  // Reports & Analytics
  reports: { name: 'Business Reports', category: 'Reports & Analysis' },
  expenses: { name: 'Expense Tracking', category: 'Expense Tracking' },
  
  // Settings & Configuration
  settings: { name: 'General Settings', category: 'Settings' },
  dropdownSettings: { name: 'Dropdown Settings', category: 'Settings' },
  
  // Communication & Support
  whatsapp: { name: 'WhatsApp Integration', category: 'Support' },
  support: { name: '24/7 Support', category: 'Support' },
  lowStock: { name: 'Low Stock Alerts', category: 'Support' },
  multilingual: { name: 'Multilingual Support', category: 'Support' },
  
  // Referrals
  referrals: { name: 'Referral System', category: 'Marketing' }
} as const

export type FeatureKey = keyof typeof AVAILABLE_FEATURES

export const FEATURE_CATEGORIES = [
  'Core',
  'Inventory Management',
  'Customer Management',
  'Bills & Purchase Records',
  'HR & Staff Management',
  'Reports & Analysis',
  'Expense Tracking',
  'Support',
  'Settings',
  'Marketing'
] as const

// Default feature sets for different plan tiers
export const DEFAULT_FEATURE_SETS = {
  basic: ['dashboard', 'inventory', 'pos', 'customers', 'settings', 'lowStock'],
  standard: ['dashboard', 'inventory', 'pos', 'customers', 'purchases', 'bills', 'hr', 'commission', 'reports', 'expenses', 'settings', 'dropdownSettings', 'whatsapp', 'lowStock', 'support'],
  premium: Object.keys(AVAILABLE_FEATURES) as FeatureKey[]
}
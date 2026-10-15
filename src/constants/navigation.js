import {
  BarChart3,
  BookOpen,
  CreditCard,
  Gauge,
  LayoutDashboard,
  PiggyBank,
  Repeat2,
  Settings,
  ShieldCheck,
  Target,
  Wallet,
} from 'lucide-react';

export const navigation = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        description: 'Your complete financial overview',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        icon: BarChart3,
        description: 'Financial trends and intelligence',
        badge: 'AI',
      },
    ],
  },

  {
    id: 'money',
    label: 'Money Management',
    items: [
      {
        id: 'transactions',
        label: 'Transactions',
        path: '/transactions',
        icon: CreditCard,
        description: 'Track every income and expense',
      },
      {
        id: 'accounts',
        label: 'Accounts',
        path: '/accounts',
        icon: Wallet,
        description: 'Manage your financial accounts',
      },
      {
        id: 'budgets',
        label: 'Budgets',
        path: '/budgets',
        icon: Target,
        description: 'Plan and control your spending',
      },
      {
        id: 'savings',
        label: 'Savings',
        path: '/savings',
        icon: PiggyBank,
        description: 'Track savings goals and progress',
      },
      {
        id: 'debts',
        label: 'Debts',
        path: '/debts',
        icon: Gauge,
        description: 'Manage liabilities and repayment',
      },
      {
        id: 'recurring',
        label: 'Recurring',
        path: '/recurring',
        icon: Repeat2,
        description: 'Bills, subscriptions and recurring money',
      },
    ],
  },

  {
    id: 'management',
    label: 'Management',
    items: [
      {
        id: 'categories',
        label: 'Categories',
        path: '/categories',
        icon: BookOpen,
        description: 'Organize your financial activity',
      },
      {
        id: 'audit',
        label: 'Audit Log',
        path: '/audit',
        icon: ShieldCheck,
        description: 'Review important financial activity',
      },
    ],
  },
];

export const secondaryNavigation = [
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'Configure your FinSight workspace',
  },
];

export const navigationLookup = navigation
  .flatMap((section) => section.items)
  .concat(secondaryNavigation)
  .reduce((lookup, item) => {
    lookup[item.path] = item;
    return lookup;
  }, {});

export const getNavigationItem = (path) => {
  return navigationLookup[path] ?? null;
};

export const getNavigationSection = (path) => {
  return navigation.find((section) =>
    section.items.some((item) => item.path === path),
  ) ?? null;
};

export default navigation;
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type PlanId = 'monthly' | 'sixmonth' | 'annual';

export interface SubscriptionPlan {
  id: PlanId;
  title: string;
  price: string;
  period: string;
  perMonth: string;
  badge?: string;
  savings?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$4.99',
    period: 'per month',
    perMonth: '$4.99/mo',
  },
  {
    id: 'sixmonth',
    title: '6-Month',
    price: '$22.99',
    period: 'every 6 months',
    perMonth: '$3.83/mo',
    savings: 'Save 23%',
  },
  {
    id: 'annual',
    title: 'Annual',
    price: '$34.99',
    period: 'per year',
    perMonth: '$2.92/mo',
    badge: 'Best Value',
    savings: 'Save 41%',
  },
];

interface SubscriptionContextValue {
  isPro: boolean;
  activePlan: PlanId | null;
  isLoading: boolean;
  purchasePlan: (planId: PlanId) => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPro: false,
  activePlan: null,
  isLoading: false,
  purchasePlan: async () => {},
  restorePurchases: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [activePlan, setActivePlan] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const purchasePlan = useCallback(async (planId: PlanId) => {
    console.log('[Subscription] Purchase initiated for plan:', planId);
    setIsLoading(true);
    try {
      // RevenueCat purchase will be wired here once connected
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsPro(true);
      setActivePlan(planId);
      console.log('[Subscription] Purchase successful for plan:', planId);
    } catch (err) {
      console.error('[Subscription] Purchase failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    console.log('[Subscription] Restore purchases initiated');
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('[Subscription] Restore purchases completed');
    } catch (err) {
      console.error('[Subscription] Restore failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ isPro, activePlan, isLoading, purchasePlan, restorePurchases }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

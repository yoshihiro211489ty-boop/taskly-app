import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// TODO: RevenueCat ダッシュボード (app.revenuecat.com) でアプリを作成して
// API キーを取得し、eas.json の EAS Secrets または .env に設定してください。
// iOS: REVENUECAT_IOS_KEY / Android: REVENUECAT_ANDROID_KEY
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

export const ENTITLEMENT_PREMIUM = 'premium';

export const FREE_LIMITS = {
  maxTasks: 10,
  maxRoutines: 5,
} as const;

let _initialized = false;

export async function initBilling(userId?: string): Promise<void> {
  if (_initialized) return;
  const key = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!key) {
    console.warn('[billing] RevenueCat API key not set — billing disabled');
    return;
  }
  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: key, appUserID: userId });
    _initialized = true;
  } catch (e) {
    console.warn('[billing] init error:', e);
  }
}

export async function isPremium(): Promise<boolean> {
  if (!_initialized) return false;
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
  } catch {
    return false;
  }
}

export async function getOfferings() {
  if (!_initialized) return null;
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePremium(packageToBuy: Parameters<typeof Purchases.purchasePackage>[0]) {
  const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
  return customerInfo.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
}

export async function restorePurchases(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return info.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
}

export function usePremium(): { isPremium: boolean; loading: boolean } {
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isPremium()
      .then(setPremium)
      .finally(() => setLoading(false));
  }, []);

  return { isPremium: premium, loading };
}

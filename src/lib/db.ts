import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { KioskLicense, BroadcastAnnouncement, SystemConfig, LicenseStatus, PlanPricing, SubscriptionTransaction, PaymentMethodType, PlanType } from './types';

const INITIAL_KIOSKS: KioskLicense[] = [
  {
    id: 'kiosk-001',
    cspCode: '3A450557',
    operatorName: 'Nagmani Bhardwaj',
    mobileNumber: '7004526504',
    location: '',
    plan: '12_MONTHS',
    planName: '12 Months Enterprise',
    amount: 1799,
    issuedAt: '2026-11-09T00:00:00.000Z',
    expiresAt: '2027-11-09T23:59:59.000Z',
    status: 'ACTIVE',
    notes: 'Primary Master Kiosk - 12 Months Subscribed',
    lastSeenAt: new Date().toISOString(),
    appVersion: '2.2.0',
  }
];

const INITIAL_TRANSACTIONS: SubscriptionTransaction[] = [
  {
    id: 'txn-init-001',
    kioskId: 'kiosk-001',
    cspCode: '3A450557',
    operatorName: 'Nagmani Bhardwaj',
    mobileNumber: '7004526504',
    location: '',
    plan: '12_MONTHS',
    planName: '12 Months Enterprise',
    amount: 1799,
    durationDays: 365,
    paymentMethod: 'UPI',
    utrNumber: 'UPI431600982711',
    notes: 'Official 12 Months Subscription Activation',
    status: 'COMPLETED',
    createdAt: '2026-11-09T00:00:00.000Z',
  }
];

const INITIAL_BROADCAST: BroadcastAnnouncement = {
  enabled: true,
  message: 'Welcome to KioskPro Enterprise! High-speed automated SBI Kiosk portal active.',
  level: 'info',
  updatedAt: new Date().toISOString()
};

export const DEFAULT_PLANS: PlanPricing[] = [
  {
    planId: '1_DAY_TRIAL',
    name: '1-Day Free Trial',
    durationMonths: 0,
    durationDays: 1,
    price: 0,
    originalPrice: 0,
    badge: 'Free Access',
    description: 'Bina payment 24 ghante tak poora KioskPro chalayein',
  },
  {
    planId: '1_MONTH',
    name: '1 Month Starter License',
    durationMonths: 1,
    price: 199,
    originalPrice: 299,
    badge: 'Starter',
    description: '30 Days full CSP auto-login & fast automation',
  },
  {
    planId: '3_MONTHS',
    name: '3 Months Quarterly Plan',
    durationMonths: 3,
    price: 449,
    originalPrice: 699,
    badge: 'Quarterly',
    description: 'Quarterly uninterrupted kiosk automation access',
  },
  {
    planId: '6_MONTHS',
    name: '6 Months Half-Yearly Plan',
    durationMonths: 6,
    price: 999,
    originalPrice: 1499,
    badge: 'Popular',
    description: 'Standard 6 months license for active kiosks',
  },
  {
    planId: '12_MONTHS',
    name: '12 Months Annual Access',
    durationMonths: 12,
    price: 1799,
    originalPrice: 2999,
    badge: 'Best Value',
    description: 'Full 1 Year uninterrupted license, updates & support',
  },
];

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  distributorName: 'KioskPro Support',
  distributorPhone: '9212716009',
  distributorUpi: '9212716009@yescred',
  qrCodeUrl: '/qr_code.jpg',
  minRequiredVersion: '2.1.5',
  latestVersion: '2.2.0',
  plans: DEFAULT_PLANS,
};

let inMemorySystemConfig: SystemConfig = { ...DEFAULT_SYSTEM_CONFIG };

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL 
    || process.env.KV_REST_API_URL 
    || 'https://oriented-narwhal-73778.upstash.io';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN 
    || process.env.KV_REST_API_TOKEN 
    || 'gQAAAAAAASAyAAIgcDEzYmRkOWZjNzdiYzU0ZTUzYTkzMzcxN2ZkYzkwZWNjOQ';
  try {
    return new Redis({ url, token });
  } catch (err) {
    console.warn('Failed to initialize Upstash Redis:', err);
    return null;
  }
}

// Global in-memory storage for fallback
let inMemoryKiosks: KioskLicense[] = [...INITIAL_KIOSKS];
let inMemoryBroadcast: BroadcastAnnouncement = { ...INITIAL_BROADCAST };
let inMemoryTransactions: SubscriptionTransaction[] = [...INITIAL_TRANSACTIONS];

// Local file path (for local development or persistent mounts)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'kiosks.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.kiosks) && parsed.kiosks.length > 0) {
        inMemoryKiosks = parsed.kiosks;
      }
      if (parsed.broadcast) {
        inMemoryBroadcast = parsed.broadcast;
      }
      if (parsed.systemConfig) {
        inMemorySystemConfig = {
          ...DEFAULT_SYSTEM_CONFIG,
          ...parsed.systemConfig,
          plans: Array.isArray(parsed.systemConfig.plans) && parsed.systemConfig.plans.length > 0
            ? parsed.systemConfig.plans
            : DEFAULT_PLANS,
        };
      }
      if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
        inMemoryTransactions = parsed.transactions;
      }
    } else {
      saveToFile();
    }
  } catch (err) {
    // In read-only serverless environments, file access is safely bypassed
  }
}

function saveToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          kiosks: inMemoryKiosks,
          broadcast: inMemoryBroadcast,
          systemConfig: inMemorySystemConfig,
          transactions: inMemoryTransactions,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      )
    );
  } catch { }
}

async function persistData() {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set('kioskpro_kiosks', inMemoryKiosks);
      await redis.set('kioskpro_broadcast', inMemoryBroadcast);
      await redis.set('kioskpro_system_config', inMemorySystemConfig);
      await redis.set('kioskpro_transactions', inMemoryTransactions);
    } catch (err) {
      console.warn('Redis write error:', err);
    }
  }
  saveToFile();
}

// Initialize file cache on load
ensureDataFile();

export async function getKiosks(): Promise<KioskLicense[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<KioskLicense[]>('kioskpro_kiosks');
      if (Array.isArray(data) && data.length > 0) {
        inMemoryKiosks = data;
      } else {
        // Seed initial data into newly connected Redis
        await redis.set('kioskpro_kiosks', inMemoryKiosks);
      }
    } catch (err) {
      console.warn('Redis read error, fallback to memory:', err);
    }
  } else {
    ensureDataFile();
  }

  // Auto-check and mark expired kiosks
  const now = new Date();
  let modified = false;
  inMemoryKiosks = inMemoryKiosks.map((k) => {
    if (k.status === 'ACTIVE' && new Date(k.expiresAt) < now) {
      modified = true;
      return { ...k, status: 'EXPIRED' as LicenseStatus };
    }
    return k;
  });

  if (modified) {
    await persistData();
  }

  return inMemoryKiosks;
}

export async function getKioskByCspCode(cspCode: string): Promise<KioskLicense | undefined> {
  const kiosks = await getKiosks();
  const clean = cspCode.trim().toLowerCase();
  return kiosks.find((k) => k.cspCode.trim().toLowerCase() === clean);
}

export async function addKiosk(
  data: Omit<KioskLicense, 'id' | 'issuedAt' | 'expiresAt' | 'status'> & { durationMonths?: number; durationDays?: number; utrNumber?: string; paymentMethod?: PaymentMethodType },
  recordTransaction: boolean = true
): Promise<KioskLicense> {
  const kiosks = await getKiosks();
  const now = new Date();
  const expiry = new Date(now);

  if (data.plan === '1_DAY_TRIAL' || data.durationDays === 1) {
    expiry.setDate(expiry.getDate() + 1);
  } else {
    const months = data.durationMonths || (data.plan === '1_MONTH' ? 1 : data.plan === '3_MONTHS' ? 3 : data.plan === '6_MONTHS' ? 6 : data.plan === '12_MONTHS' ? 12 : 120);
    expiry.setMonth(expiry.getMonth() + months);
  }

  const newKiosk: KioskLicense = {
    ...data,
    id: `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    issuedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    status: 'ACTIVE',
    hasUsedTrial: true,
  };

  kiosks.unshift(newKiosk);
  inMemoryKiosks = kiosks;
  await persistData();

  if (recordTransaction) {
    try {
      const durationDays = (newKiosk.plan === '1_DAY_TRIAL' || data.durationDays === 1) 
        ? 1 
        : ((data.durationMonths || 1) * 30);
      await addTransaction({
        kioskId: newKiosk.id,
        cspCode: newKiosk.cspCode,
        operatorName: newKiosk.operatorName,
        mobileNumber: newKiosk.mobileNumber,
        location: newKiosk.location,
        plan: newKiosk.plan,
        planName: newKiosk.planName,
        amount: newKiosk.amount,
        durationDays,
        paymentMethod: data.paymentMethod || (newKiosk.plan === '1_DAY_TRIAL' ? 'FREE_TRIAL' : 'UPI'),
        utrNumber: data.utrNumber ? String(data.utrNumber).trim() : undefined,
        notes: newKiosk.notes || 'New Kiosk Registration',
        status: 'COMPLETED',
      });
    } catch (err) {
      console.warn('Failed to add transaction for new kiosk:', err);
    }
  }

  return newKiosk;
}

export async function grantTrial(
  cspCode: string,
  operatorName?: string,
  mobileNumber?: string,
  location?: string,
  hwid?: string,
  appVersion?: string
): Promise<{ success: boolean; message: string; kiosk?: KioskLicense }> {
  const clean = cspCode.trim().toLowerCase();
  const kiosks = await getKiosks();
  const existing = kiosks.find((k) => k.cspCode.trim().toLowerCase() === clean);

  if (existing) {
    const now = new Date();
    const isCurrentlyActive = existing.status === 'ACTIVE' && new Date(existing.expiresAt) > now;

    // Rule 1: Jisne subscription leliya use trial mat do
    if (isCurrentlyActive && existing.plan !== '1_DAY_TRIAL') {
      return {
        success: false,
        message: `Aapka KioskPro subscription pehle se active hai (${existing.planName}). 1-Day Trial lene ki zaroorat nahi hai.`,
      };
    }

    // Rule 2: Jisne ek baar trial leliya wo doosri baar nahi le sakta
    if (existing.hasUsedTrial) {
      return {
        success: false,
        message: `CSP Code '${cspCode}' pehle hi 1-Day Free Trial use kar chuka hai. Ek device/CSP code par trial sirf ek baar milta hai. Kripya subscription renew karein.`,
      };
    }

    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    existing.plan = '1_DAY_TRIAL';
    existing.planName = '1-Day Free Trial (₹0)';
    existing.amount = 0;
    existing.issuedAt = now.toISOString();
    existing.expiresAt = expiry.toISOString();
    existing.status = 'ACTIVE';
    existing.hasUsedTrial = true;
    if (operatorName && (!existing.operatorName || existing.operatorName === 'SBI CSP Operator')) {
      existing.operatorName = operatorName;
    }
    if (mobileNumber && !existing.mobileNumber) existing.mobileNumber = mobileNumber;
    if (location && !existing.location) existing.location = location;
    if (hwid) existing.machineHwid = hwid;
    if (appVersion && appVersion.trim()) existing.appVersion = appVersion.trim();

    inMemoryKiosks = kiosks;
    await persistData();

    try {
      await addTransaction({
        kioskId: existing.id,
        cspCode: existing.cspCode,
        operatorName: existing.operatorName,
        mobileNumber: existing.mobileNumber,
        location: existing.location,
        plan: '1_DAY_TRIAL',
        planName: '1-Day Free Trial (₹0)',
        amount: 0,
        durationDays: 1,
        paymentMethod: 'FREE_TRIAL',
        notes: '1-Day Free Trial activation',
        status: 'COMPLETED',
      });
    } catch { }

    return {
      success: true,
      message: '1-Day Free Trial activated successfully! Valid for 24 hours.',
      kiosk: existing,
    };
  }

  // Create new trial kiosk record
  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const newTrial: KioskLicense = {
    id: `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    cspCode: cspCode.trim(),
    operatorName: operatorName?.trim() || 'SBI CSP Operator',
    mobileNumber: mobileNumber?.trim() || '',
    location: location?.trim() || 'India',
    plan: '1_DAY_TRIAL',
    planName: '1-Day Free Trial (₹0)',
    amount: 0,
    issuedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    status: 'ACTIVE',
    hasUsedTrial: true,
    machineHwid: hwid,
    notes: '1-Day Trial Activated',
    lastSeenAt: now.toISOString(),
    appVersion: appVersion?.trim() || '2.1.9',
  };

  kiosks.unshift(newTrial);
  inMemoryKiosks = kiosks;
  await persistData();

  try {
    await addTransaction({
      kioskId: newTrial.id,
      cspCode: newTrial.cspCode,
      operatorName: newTrial.operatorName,
      mobileNumber: newTrial.mobileNumber,
      location: newTrial.location,
      plan: '1_DAY_TRIAL',
      planName: '1-Day Free Trial (₹0)',
      amount: 0,
      durationDays: 1,
      paymentMethod: 'FREE_TRIAL',
      notes: '1-Day Free Trial activation',
      status: 'COMPLETED',
    });
  } catch { }

  return {
    success: true,
    message: '1-Day Free Trial activated successfully! Valid for 24 hours.',
    kiosk: newTrial,
  };
}

export async function updateKiosk(id: string, updates: Partial<KioskLicense>): Promise<KioskLicense | null> {
  const kiosks = await getKiosks();
  const idx = kiosks.findIndex((k) => k.id === id || k.cspCode.toLowerCase() === id.toLowerCase());
  if (idx === -1) return null;

  kiosks[idx] = {
    ...kiosks[idx],
    ...updates,
  };
  inMemoryKiosks = kiosks;
  await persistData();
  return kiosks[idx];
}

export async function renewKiosk(
  id: string, 
  days: number,
  planInfo?: { 
    plan?: PlanType; 
    planName?: string; 
    amount?: number; 
    paymentMethod?: PaymentMethodType; 
    utrNumber?: string; 
    notes?: string; 
  },
  recordTransaction: boolean = true
): Promise<KioskLicense | null> {
  const kiosks = await getKiosks();
  const idx = kiosks.findIndex((k) => k.id === id || k.cspCode.toLowerCase() === id.toLowerCase());
  if (idx === -1) return null;

  const current = kiosks[idx];
  const now = new Date();
  const currentExpiry = new Date(current.expiresAt);
  const baseDate = currentExpiry > now ? currentExpiry : now;
  
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + days);

  const updatedPlan = planInfo?.plan || current.plan;
  const updatedPlanName = planInfo?.planName || current.planName;
  const updatedAmount = planInfo?.amount !== undefined ? planInfo.amount : current.amount;

  kiosks[idx] = {
    ...current,
    plan: updatedPlan,
    planName: updatedPlanName,
    amount: updatedAmount,
    expiresAt: newExpiry.toISOString(),
    status: 'ACTIVE',
    hasUsedTrial: true,
  };

  inMemoryKiosks = kiosks;
  await persistData();

  if (recordTransaction) {
    try {
      await addTransaction({
        kioskId: current.id,
        cspCode: current.cspCode,
        operatorName: current.operatorName,
        mobileNumber: current.mobileNumber,
        location: current.location,
        plan: updatedPlan,
        planName: updatedPlanName,
        amount: updatedAmount,
        durationDays: days,
        paymentMethod: planInfo?.paymentMethod || 'UPI',
        utrNumber: planInfo?.utrNumber,
        notes: planInfo?.notes || `Subscription renewed for ${days} days`,
        status: 'COMPLETED',
      });
    } catch (err) {
      console.warn('Failed to record renewal transaction:', err);
    }
  }

  return kiosks[idx];
}

export async function toggleKioskStatus(id: string, status: LicenseStatus): Promise<KioskLicense | null> {
  const kiosks = await getKiosks();
  const idx = kiosks.findIndex((k) => k.id === id || k.cspCode.toLowerCase() === id.toLowerCase());
  if (idx === -1) return null;

  kiosks[idx] = {
    ...kiosks[idx],
    status,
  };
  inMemoryKiosks = kiosks;
  await persistData();
  return kiosks[idx];
}

export async function deleteKiosk(id: string): Promise<boolean> {
  const kiosks = await getKiosks();
  const before = kiosks.length;
  const filtered = kiosks.filter((k) => k.id !== id && k.cspCode.toLowerCase() !== id.toLowerCase());
  if (filtered.length !== before) {
    inMemoryKiosks = filtered;
    await persistData();
    return true;
  }
  return false;
}

export async function updateLastSeen(cspCode: string, machineHwid?: string, appVersion?: string): Promise<void> {
  const kiosks = await getKiosks();
  const clean = cspCode.trim().toLowerCase();
  const kiosk = kiosks.find((k) => k.cspCode.trim().toLowerCase() === clean);
  if (kiosk) {
    kiosk.lastSeenAt = new Date().toISOString();
    if (machineHwid && !kiosk.machineHwid) {
      kiosk.machineHwid = machineHwid;
    }
    if (appVersion && appVersion.trim()) {
      kiosk.appVersion = appVersion.trim();
    }
    inMemoryKiosks = kiosks;
    await persistData();
  }
}

export async function getBroadcast(): Promise<BroadcastAnnouncement> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<BroadcastAnnouncement>('kioskpro_broadcast');
      if (data && data.message) {
        inMemoryBroadcast = data;
        return inMemoryBroadcast;
      } else {
        await redis.set('kioskpro_broadcast', inMemoryBroadcast);
      }
    } catch { }
  } else {
    ensureDataFile();
  }
  return inMemoryBroadcast;
}

export async function setBroadcast(broadcast: Partial<BroadcastAnnouncement>): Promise<BroadcastAnnouncement> {
  await getBroadcast();
  inMemoryBroadcast = {
    ...inMemoryBroadcast,
    ...broadcast,
    updatedAt: new Date().toISOString(),
  };
  await persistData();
  return inMemoryBroadcast;
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<SystemConfig>('kioskpro_system_config');
      if (data && data.distributorUpi) {
        if (data.distributorName === 'Hritik Bhardwaj') {
          data.distributorName = 'KioskPro Support';
        }
        inMemorySystemConfig = {
          ...DEFAULT_SYSTEM_CONFIG,
          ...data,
          plans: Array.isArray(data.plans) && data.plans.length > 0 ? data.plans : DEFAULT_PLANS,
        };
        return inMemorySystemConfig;
      } else {
        await redis.set('kioskpro_system_config', inMemorySystemConfig);
      }
    } catch { }
  } else {
    ensureDataFile();
  }
  return inMemorySystemConfig;
}

export async function updateSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
  await getSystemConfig();
  inMemorySystemConfig = {
    ...inMemorySystemConfig,
    ...config,
    plans: config.plans && config.plans.length > 0 ? config.plans : inMemorySystemConfig.plans,
  };
  await persistData();
  return inMemorySystemConfig;
}

export function getSystemConfigSync(): SystemConfig {
  return inMemorySystemConfig;
}

// -------------------------------------------------------------
// SUBSCRIPTION TRANSACTIONS LEDGER
// -------------------------------------------------------------
export async function getTransactions(): Promise<SubscriptionTransaction[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<SubscriptionTransaction[]>('kioskpro_transactions');
      if (Array.isArray(data) && data.length > 0) {
        inMemoryTransactions = data;
        return inMemoryTransactions;
      } else {
        await redis.set('kioskpro_transactions', inMemoryTransactions);
      }
    } catch (err) {
      console.warn('Redis getTransactions error:', err);
    }
  } else {
    ensureDataFile();
  }
  return inMemoryTransactions;
}

export async function addTransaction(
  data: Omit<SubscriptionTransaction, 'id' | 'createdAt'>
): Promise<SubscriptionTransaction> {
  const txns = await getTransactions();
  const newTxn: SubscriptionTransaction = {
    ...data,
    id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  txns.unshift(newTxn);
  inMemoryTransactions = txns;
  await persistData();
  return newTxn;
}

import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { KioskLicense, BroadcastAnnouncement, SystemConfig, LicenseStatus } from './types';

const INITIAL_KIOSKS: KioskLicense[] = [
  {
    id: 'kiosk-001',
    cspCode: '3A450557',
    operatorName: 'Nagmani Bhardwaj',
    mobileNumber: '9212716009',
    location: 'Patna, Bihar',
    plan: '12_MONTHS',
    planName: '12 Months Enterprise',
    amount: 1799,
    issuedAt: '2026-11-09T00:00:00.000Z',
    expiresAt: '2027-11-09T23:59:59.000Z',
    status: 'ACTIVE',
    notes: 'Primary Master Kiosk - 12 Months Subscribed',
    lastSeenAt: new Date().toISOString()
  }
];

const INITIAL_BROADCAST: BroadcastAnnouncement = {
  enabled: true,
  message: 'Welcome to KioskPro Enterprise! High-speed automated SBI Kiosk portal active.',
  level: 'info',
  updatedAt: new Date().toISOString()
};

const SYSTEM_CONFIG: SystemConfig = {
  distributorName: 'Hritik Bhardwaj',
  distributorPhone: '9212716009',
  distributorUpi: '9212716009@yescred',
  minRequiredVersion: '2.0.6',
  latestVersion: '2.0.6'
};

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch {
      return null;
    }
  }
  return null;
}

// Global in-memory storage for fallback
let inMemoryKiosks: KioskLicense[] = [...INITIAL_KIOSKS];
let inMemoryBroadcast: BroadcastAnnouncement = { ...INITIAL_BROADCAST };

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

export async function addKiosk(data: Omit<KioskLicense, 'id' | 'issuedAt' | 'expiresAt' | 'status'> & { durationMonths?: number }): Promise<KioskLicense> {
  await getKiosks();
  const now = new Date();
  const months = data.durationMonths || (data.plan === '1_MONTH' ? 1 : data.plan === '3_MONTHS' ? 3 : data.plan === '6_MONTHS' ? 6 : data.plan === '12_MONTHS' ? 12 : 120);
  
  const expiry = new Date(now);
  expiry.setMonth(expiry.getMonth() + months);

  const newKiosk: KioskLicense = {
    ...data,
    id: `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    issuedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    status: 'ACTIVE',
  };

  inMemoryKiosks.unshift(newKiosk);
  await persistData();
  return newKiosk;
}

export async function updateKiosk(id: string, updates: Partial<KioskLicense>): Promise<KioskLicense | null> {
  await getKiosks();
  const idx = inMemoryKiosks.findIndex((k) => k.id === id);
  if (idx === -1) return null;

  inMemoryKiosks[idx] = {
    ...inMemoryKiosks[idx],
    ...updates,
  };
  await persistData();
  return inMemoryKiosks[idx];
}

export async function renewKiosk(id: string, days: number): Promise<KioskLicense | null> {
  await getKiosks();
  const idx = inMemoryKiosks.findIndex((k) => k.id === id);
  if (idx === -1) return null;

  const current = inMemoryKiosks[idx];
  const now = new Date();
  const currentExpiry = new Date(current.expiresAt);
  const baseDate = currentExpiry > now ? currentExpiry : now;
  
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + days);

  inMemoryKiosks[idx] = {
    ...current,
    expiresAt: newExpiry.toISOString(),
    status: 'ACTIVE',
  };

  await persistData();
  return inMemoryKiosks[idx];
}

export async function toggleKioskStatus(id: string, status: LicenseStatus): Promise<KioskLicense | null> {
  await getKiosks();
  const idx = inMemoryKiosks.findIndex((k) => k.id === id);
  if (idx === -1) return null;

  inMemoryKiosks[idx] = {
    ...inMemoryKiosks[idx],
    status,
  };
  await persistData();
  return inMemoryKiosks[idx];
}

export async function deleteKiosk(id: string): Promise<boolean> {
  await getKiosks();
  const before = inMemoryKiosks.length;
  inMemoryKiosks = inMemoryKiosks.filter((k) => k.id !== id);
  if (inMemoryKiosks.length !== before) {
    await persistData();
    return true;
  }
  return false;
}

export async function updateLastSeen(cspCode: string, machineHwid?: string): Promise<void> {
  const clean = cspCode.trim().toLowerCase();
  const kiosk = inMemoryKiosks.find((k) => k.cspCode.trim().toLowerCase() === clean);
  if (kiosk) {
    kiosk.lastSeenAt = new Date().toISOString();
    if (machineHwid && !kiosk.machineHwid) {
      kiosk.machineHwid = machineHwid;
    }
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
  inMemoryBroadcast = {
    ...inMemoryBroadcast,
    ...broadcast,
    updatedAt: new Date().toISOString(),
  };
  await persistData();
  return inMemoryBroadcast;
}

export function getSystemConfig(): SystemConfig {
  return SYSTEM_CONFIG;
}

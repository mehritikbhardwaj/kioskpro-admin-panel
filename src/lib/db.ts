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
  minRequiredVersion: '2.0.5',
  latestVersion: '2.0.5'
};

// Global in-memory storage for serverless runtime
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
      if (Array.isArray(parsed.kiosks)) {
        inMemoryKiosks = parsed.kiosks;
      }
      if (parsed.broadcast) {
        inMemoryBroadcast = parsed.broadcast;
      }
    } else {
      saveToFile();
    }
  } catch (err) {
    console.error('File storage access error (using memory fallback):', err);
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
  } catch (err) {
    // In serverless environment like Vercel Lambda, disk write might be read-only
    console.warn('Could not persist to disk (serverless runtime):', err);
  }
}

// Initialize on first load
ensureDataFile();

export async function getKiosks(): Promise<KioskLicense[]> {
  ensureDataFile();
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
  if (modified) saveToFile();
  return inMemoryKiosks;
}

export async function getKioskByCspCode(cspCode: string): Promise<KioskLicense | undefined> {
  const kiosks = await getKiosks();
  const clean = cspCode.trim().toLowerCase();
  return kiosks.find((k) => k.cspCode.trim().toLowerCase() === clean);
}

export async function addKiosk(data: Omit<KioskLicense, 'id' | 'issuedAt' | 'expiresAt' | 'status'> & { durationMonths?: number }): Promise<KioskLicense> {
  ensureDataFile();
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
  saveToFile();
  return newKiosk;
}

export async function updateKiosk(id: string, updates: Partial<KioskLicense>): Promise<KioskLicense | null> {
  ensureDataFile();
  const idx = inMemoryKiosks.findIndex((k) => k.id === id);
  if (idx === -1) return null;

  inMemoryKiosks[idx] = {
    ...inMemoryKiosks[idx],
    ...updates,
  };
  saveToFile();
  return inMemoryKiosks[idx];
}

export async function renewKiosk(id: string, days: number): Promise<KioskLicense | null> {
  ensureDataFile();
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

  saveToFile();
  return inMemoryKiosks[idx];
}

export async function toggleKioskStatus(id: string, status: LicenseStatus): Promise<KioskLicense | null> {
  ensureDataFile();
  const idx = inMemoryKiosks.findIndex((k) => k.id === id);
  if (idx === -1) return null;

  inMemoryKiosks[idx] = {
    ...inMemoryKiosks[idx],
    status,
  };
  saveToFile();
  return inMemoryKiosks[idx];
}

export async function deleteKiosk(id: string): Promise<boolean> {
  ensureDataFile();
  const before = inMemoryKiosks.length;
  inMemoryKiosks = inMemoryKiosks.filter((k) => k.id !== id);
  if (inMemoryKiosks.length !== before) {
    saveToFile();
    return true;
  }
  return false;
}

export async function updateLastSeen(cspCode: string, machineHwid?: string): Promise<void> {
  ensureDataFile();
  const clean = cspCode.trim().toLowerCase();
  const kiosk = inMemoryKiosks.find((k) => k.cspCode.trim().toLowerCase() === clean);
  if (kiosk) {
    kiosk.lastSeenAt = new Date().toISOString();
    if (machineHwid && !kiosk.machineHwid) {
      kiosk.machineHwid = machineHwid;
    }
    saveToFile();
  }
}

export async function getBroadcast(): Promise<BroadcastAnnouncement> {
  ensureDataFile();
  return inMemoryBroadcast;
}

export async function setBroadcast(broadcast: Partial<BroadcastAnnouncement>): Promise<BroadcastAnnouncement> {
  ensureDataFile();
  inMemoryBroadcast = {
    ...inMemoryBroadcast,
    ...broadcast,
    updatedAt: new Date().toISOString(),
  };
  saveToFile();
  return inMemoryBroadcast;
}

export function getSystemConfig(): SystemConfig {
  return SYSTEM_CONFIG;
}

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export type PlanType = '1_DAY_TRIAL' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | 'LIFETIME';

export interface KioskLicense {
  id: string;
  cspCode: string;
  operatorName: string;
  mobileNumber: string;
  location: string;
  plan: PlanType;
  planName: string;
  amount: number;
  issuedAt: string;
  expiresAt: string;
  status: LicenseStatus;
  machineHwid?: string;
  notes?: string;
  lastSeenAt?: string;
  hasUsedTrial?: boolean;
}

export interface BroadcastAnnouncement {
  enabled: boolean;
  message: string;
  level: 'info' | 'warning' | 'critical';
  updatedAt: string;
}

export interface PlanPricing {
  planId: PlanType;
  name: string;
  durationMonths: number;
  durationDays?: number;
  price: number;
  originalPrice: number;
  badge?: string;
  description: string;
}

export interface SystemConfig {
  distributorName: string;
  distributorPhone: string;
  distributorUpi: string;
  qrCodeUrl?: string;
  minRequiredVersion: string;
  latestVersion: string;
  plans: PlanPricing[];
}

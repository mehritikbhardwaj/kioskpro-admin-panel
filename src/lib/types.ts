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
  appVersion?: string;
  remoteScreenshotEnabled?: boolean;
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

export type PaymentMethodType = 'UPI' | 'CASH' | 'FREE_TRIAL' | 'ADMIN_OVERRIDE' | 'BANK_TRANSFER';

export interface SubscriptionTransaction {
  id: string;
  kioskId?: string;
  cspCode: string;
  operatorName: string;
  mobileNumber?: string;
  location?: string;
  plan: PlanType;
  planName: string;
  amount: number;
  durationDays: number;
  paymentMethod: PaymentMethodType;
  utrNumber?: string;
  notes?: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
  createdAt: string;
}

export interface DomFieldInfo {
  id: string;
  name: string;
  placeholder: string;
  type: string;
  label?: string;
}

export interface DomButtonInfo {
  text: string;
  id: string;
  className?: string;
}

export interface DomRadioInfo {
  name: string;
  value: string;
  label: string;
  checked?: boolean;
}

export interface DomSelectInfo {
  id: string;
  name: string;
  label: string;
  options: string[];
}

export interface DomCaptureSnapshot {
  screenKey: string;
  cspCode: string;
  appVersion?: string;
  urlPath: string;
  pageTitle: string;
  activeMenu?: string;
  bodyPreview?: string;
  inputs: DomFieldInfo[];
  radios?: DomRadioInfo[];
  selects?: DomSelectInfo[];
  buttons: DomButtonInfo[];
  tableHeaders?: string[];
  hasModal: boolean;
  modalTitle?: string;
  modalHtml?: string;
  screenshotBase64?: string;
  capturedAt: string;
}


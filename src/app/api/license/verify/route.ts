import { NextRequest, NextResponse } from 'next/server';
import { getKioskByCspCode, updateLastSeen, getBroadcast, getSystemConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cspCode = searchParams.get('csp_code') || searchParams.get('kiosk_id');
    const hwid = searchParams.get('hwid') || '';
    const version = searchParams.get('version') || '';

    const systemConfig = await getSystemConfig();
    const broadcast = await getBroadcast();

    if (!cspCode || cspCode.trim() === '') {
      return NextResponse.json(
        {
          valid: false,
          status: 'UNREGISTERED',
          message: 'CSP Code / Kiosk ID is required for license verification.',
          supportContact: systemConfig.distributorPhone,
          distributor: systemConfig.distributorName,
          upiId: systemConfig.distributorUpi,
          qrCodeUrl: systemConfig.qrCodeUrl,
          plans: systemConfig.plans,
        },
        { status: 400 }
      );
    }

    const kiosk = await getKioskByCspCode(cspCode);

    if (!kiosk) {
      return NextResponse.json(
        {
          valid: false,
          status: 'NOT_FOUND',
          cspCode: cspCode,
          message: `Kiosk ID '${cspCode}' is not registered. Please contact distributor Hritik Bhardwaj (${systemConfig.distributorPhone}) to activate.`,
          supportContact: systemConfig.distributorPhone,
          distributor: systemConfig.distributorName,
          upiId: systemConfig.distributorUpi,
          qrCodeUrl: systemConfig.qrCodeUrl,
          plans: systemConfig.plans,
        },
        { status: 404 }
      );
    }

    // Update last ping time & record hardware ID
    await updateLastSeen(cspCode, hwid);

    const now = new Date();
    const expiresAt = new Date(kiosk.expiresAt);
    const isExpired = expiresAt < now;
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    if (kiosk.status === 'SUSPENDED') {
      return NextResponse.json({
        valid: false,
        status: 'SUSPENDED',
        cspCode: kiosk.cspCode,
        operatorName: kiosk.operatorName,
        message: daysRemaining > 0
          ? `Your account has been suspended by administration (Subscription Active: ${daysRemaining} days remaining). Please contact support at ${systemConfig.distributorPhone}.`
          : 'Your KioskPro license has expired and been suspended. Please contact support.',
        supportContact: systemConfig.distributorPhone,
        distributor: systemConfig.distributorName,
        upiId: systemConfig.distributorUpi,
        qrCodeUrl: systemConfig.qrCodeUrl,
        plans: systemConfig.plans,
        daysRemaining,
        expiresAt: kiosk.expiresAt,
        hasActiveSubscription: daysRemaining > 0,
        plan: kiosk.planName,
      });
    }

    if (isExpired || kiosk.status === 'EXPIRED') {
      const isTrial = kiosk.plan === '1_DAY_TRIAL';
      return NextResponse.json({
        valid: false,
        status: 'EXPIRED',
        cspCode: kiosk.cspCode,
        operatorName: kiosk.operatorName,
        expiresAt: kiosk.expiresAt,
        daysRemaining: 0,
        isTrial,
        hasUsedTrial: true, // If expired, user has either used trial or paid sub, so trial is never available
        message: isTrial
          ? 'Your 1-Day Free Trial has ended. Please scan UPI QR to renew your subscription.'
          : `Your KioskPro subscription expired on ${expiresAt.toLocaleDateString('en-IN')}. Please scan UPI QR to renew.`,
        supportContact: systemConfig.distributorPhone,
        distributor: systemConfig.distributorName,
        upiId: systemConfig.distributorUpi,
        qrCodeUrl: systemConfig.qrCodeUrl,
        plans: systemConfig.plans,
      });
    }

    // Active License
    const isSubscribed = kiosk.status === 'ACTIVE' && kiosk.plan !== '1_DAY_TRIAL';
    return NextResponse.json({
      valid: true,
      status: 'ACTIVE',
      cspCode: kiosk.cspCode,
      operatorName: kiosk.operatorName,
      location: kiosk.location,
      plan: kiosk.planName,
      isTrial: kiosk.plan === '1_DAY_TRIAL',
      isSubscribed,
      hasUsedTrial: !!kiosk.hasUsedTrial || isSubscribed,
      issuedAt: kiosk.issuedAt,
      expiresAt: kiosk.expiresAt,
      daysRemaining,
      announcement: broadcast.enabled ? broadcast.message : null,
      announcementLevel: broadcast.level,
      latestVersion: systemConfig.latestVersion,
      minRequiredVersion: systemConfig.minRequiredVersion,
      supportContact: systemConfig.distributorPhone,
      distributor: systemConfig.distributorName,
      upiId: systemConfig.distributorUpi,
      qrCodeUrl: systemConfig.qrCodeUrl,
      plans: systemConfig.plans,
    });
  } catch (error: any) {
    console.error('License verification API error:', error);
    return NextResponse.json(
      {
        valid: false,
        status: 'ERROR',
        message: 'Internal server error verifying license.',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

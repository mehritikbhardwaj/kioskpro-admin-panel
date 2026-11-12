import { NextRequest, NextResponse } from 'next/server';
import { getKiosks, addKiosk, updateKiosk, renewKiosk, toggleKioskStatus, deleteKiosk } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const kiosks = await getKiosks();
  const now = new Date();

  // Calculate statistics
  const total = kiosks.length;
  const active = kiosks.filter((k) => k.status === 'ACTIVE').length;
  const expired = kiosks.filter((k) => k.status === 'EXPIRED').length;
  const suspended = kiosks.filter((k) => k.status === 'SUSPENDED').length;
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const expiringSoon = kiosks.filter(
    (k) => k.status === 'ACTIVE' && new Date(k.expiresAt) <= sevenDaysFromNow
  ).length;

  const totalRevenue = kiosks.reduce((sum, k) => sum + (k.amount || 0), 0);

  return NextResponse.json({
    success: true,
    data: kiosks,
    stats: {
      total,
      active,
      expired,
      suspended,
      expiringSoon,
      totalRevenue,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cspCode, operatorName, mobileNumber, location, plan, amount, notes, durationMonths, utrNumber, paymentMethod, appVersion } = body;

    if (!cspCode || !operatorName) {
      return NextResponse.json({ success: false, message: 'CSP Code and Operator Name are required' }, { status: 400 });
    }

    const isTrial = plan === '1_DAY_TRIAL';
    if (!isTrial && (!utrNumber || !String(utrNumber).trim())) {
      return NextResponse.json({ success: false, message: 'Transaction ID (UTR / Reference Number) is required to issue a license' }, { status: 400 });
    }

    const planNames: Record<string, string> = {
      '1_DAY_TRIAL': '1-Day Free Trial (₹0)',
      '1_MONTH': '1 Month Starter (₹199)',
      '3_MONTHS': '3 Months Quarter (₹449)',
      '6_MONTHS': '6 Months Half-Year (₹999)',
      '12_MONTHS': '12 Months Enterprise (₹1,799)',
      'LIFETIME': 'Lifetime Enterprise License',
    };

    const newKiosk = await addKiosk({
      cspCode: cspCode.trim(),
      operatorName: operatorName.trim(),
      mobileNumber: (mobileNumber || '').trim(),
      location: (location || 'India').trim(),
      plan: plan || '12_MONTHS',
      planName: planNames[plan] || '12 Months Enterprise (₹1,799)',
      amount: isTrial ? 0 : (Number(amount) || 1799),
      notes: notes || (isTrial ? '1-Day Trial Issued by Admin' : ''),
      durationMonths: isTrial ? undefined : (durationMonths ? Number(durationMonths) : undefined),
      durationDays: isTrial ? 1 : undefined,
      utrNumber: isTrial ? 'FREE_TRIAL' : String(utrNumber).trim(),
      paymentMethod: isTrial ? 'FREE_TRIAL' : (paymentMethod || 'UPI'),
      appVersion: appVersion ? String(appVersion).trim() : '2.1.9',
    });

    return NextResponse.json({ success: true, data: newKiosk });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action, days, status, updates, utrNumber, paymentMethod, notes, amount } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Kiosk ID is required' }, { status: 400 });
    }

    if (action === 'RENEW') {
      const isTrial = Number(days) === 1;
      if (!isTrial && (!utrNumber || !String(utrNumber).trim())) {
        return NextResponse.json({ success: false, message: 'Transaction ID (UTR / Reference Number) is required to extend license' }, { status: 400 });
      }

      const daysToAdd = Number(days) || 30;
      const renewed = await renewKiosk(id, daysToAdd, {
        amount: amount !== undefined ? Number(amount) : undefined,
        paymentMethod: isTrial ? 'FREE_TRIAL' : (paymentMethod || 'UPI'),
        utrNumber: isTrial ? 'FREE_TRIAL' : String(utrNumber).trim(),
        notes: notes ? String(notes).trim() : undefined,
      });
      if (!renewed) {
        return NextResponse.json({ success: false, message: `Kiosk '${id}' not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: renewed });
    }

    if (action === 'SET_STATUS' && status) {
      const updated = await toggleKioskStatus(id, status);
      if (!updated) {
        return NextResponse.json({ success: false, message: `Kiosk '${id}' not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'UPDATE' && updates) {
      const updated = await updateKiosk(id, updates);
      if (!updated) {
        return NextResponse.json({ success: false, message: `Kiosk '${id}' not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Kiosk ID required' }, { status: 400 });
    }

    const deleted = await deleteKiosk(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

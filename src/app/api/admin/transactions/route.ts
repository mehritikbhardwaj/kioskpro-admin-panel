import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getTransactions, addTransaction, getKiosks, renewKiosk } from '@/lib/db';
import { PaymentMethodType, PlanType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await getTransactions();
    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cspCode, operatorName, plan, planName, amount, durationDays, paymentMethod, utrNumber, notes, autoRenewKiosk } = body;

    if (!cspCode || !cspCode.trim()) {
      return NextResponse.json({ success: false, message: 'CSP Code is required' }, { status: 400 });
    }

    const cleanCsp = cspCode.trim();
    const kiosks = await getKiosks();
    const kiosk = kiosks.find((k) => k.cspCode.toLowerCase() === cleanCsp.toLowerCase());

    const days = Number(durationDays) || (plan === '1_MONTH' ? 30 : plan === '3_MONTHS' ? 90 : plan === '6_MONTHS' ? 180 : plan === '12_MONTHS' ? 365 : 30);
    const cost = Number(amount) || 0;

    // Record the transaction
    const txn = await addTransaction({
      kioskId: kiosk?.id,
      cspCode: cleanCsp,
      operatorName: (operatorName || kiosk?.operatorName || 'SBI CSP Operator').trim(),
      mobileNumber: kiosk?.mobileNumber,
      location: kiosk?.location,
      plan: (plan as PlanType) || '1_MONTH',
      planName: planName || (plan === '12_MONTHS' ? '12 Months Annual Access' : '1 Month Starter License'),
      amount: cost,
      durationDays: days,
      paymentMethod: (paymentMethod as PaymentMethodType) || 'UPI',
      utrNumber: utrNumber ? String(utrNumber).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      status: 'COMPLETED',
    });

    // Optionally auto-renew the kiosk if requested or kiosk exists
    if (autoRenewKiosk && kiosk) {
      await renewKiosk(kiosk.id, days, {
        plan: (plan as PlanType) || kiosk.plan,
        planName: planName || kiosk.planName,
        amount: cost,
        paymentMethod: (paymentMethod as PaymentMethodType) || 'UPI',
        utrNumber: utrNumber ? String(utrNumber).trim() : undefined,
        notes: notes ? String(notes).trim() : undefined,
      });
    }

    return NextResponse.json({ success: true, transaction: txn });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

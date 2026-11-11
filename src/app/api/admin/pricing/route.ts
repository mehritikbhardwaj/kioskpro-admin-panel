import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, verifyAdminTxnPassword } from '@/lib/auth';
import { getSystemConfig, updateSystemConfig } from '@/lib/db';
import { PlanPricing } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await getSystemConfig();
    return NextResponse.json({ success: true, config });
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
    const { txnPassword, distributorName, distributorPhone, distributorUpi, qrCodeUrl, plans } = body;

    // MANDATORY TRANSACTION PASSWORD VERIFICATION
    if (!txnPassword || !verifyAdminTxnPassword(txnPassword)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid Transaction Password! Transaction password galat hai. Prices, UPI ya QR change karne ke liye sahi Transaction Password enter karein.' 
        }, 
        { status: 403 }
      );
    }

    if (!distributorUpi || !distributorUpi.trim()) {
      return NextResponse.json({ success: false, message: 'Distributor UPI ID is required' }, { status: 400 });
    }

    if (!distributorPhone || !distributorPhone.trim()) {
      return NextResponse.json({ success: false, message: 'Distributor Phone is required' }, { status: 400 });
    }

    // Validate plans array if provided
    let cleanPlans: PlanPricing[] | undefined = undefined;
    if (Array.isArray(plans)) {
      cleanPlans = plans.map((p: any) => ({
        planId: p.planId,
        name: p.name || '',
        durationMonths: Number(p.durationMonths) || 0,
        durationDays: p.durationDays ? Number(p.durationDays) : undefined,
        price: Number(p.price) || 0,
        originalPrice: Number(p.originalPrice) || 0,
        badge: p.badge || '',
        description: p.description || '',
      }));
    }

    const updated = await updateSystemConfig({
      distributorName: (distributorName || '').trim(),
      distributorPhone: (distributorPhone || '').trim(),
      distributorUpi: (distributorUpi || '').trim(),
      qrCodeUrl: (qrCodeUrl || '').trim(),
      plans: cleanPlans,
    });

    return NextResponse.json({
      success: true,
      message: 'Pricing, UPI & QR settings updated successfully!',
      config: updated,
    });
  } catch (error: any) {
    console.error('Pricing update error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update pricing: ' + error.message }, { status: 500 });
  }
}

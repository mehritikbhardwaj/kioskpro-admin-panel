import { NextRequest, NextResponse } from 'next/server';
import { grantTrial, getSystemConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cspCode, operatorName, mobileNumber, location, hwid } = body;

    if (!cspCode || cspCode.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'CSP Code is required to activate trial.' },
        { status: 400 }
      );
    }

    const systemConfig = getSystemConfig();
    const result = await grantTrial(cspCode, operatorName, mobileNumber, location, hwid);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.kiosk,
      supportContact: systemConfig.distributorPhone,
      distributor: systemConfig.distributorName,
      upiId: systemConfig.distributorUpi,
    });
  } catch (error: any) {
    console.error('Trial activation API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to activate trial: ' + error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

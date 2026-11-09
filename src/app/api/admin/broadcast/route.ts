import { NextRequest, NextResponse } from 'next/server';
import { getBroadcast, setBroadcast } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const broadcast = await getBroadcast();
  return NextResponse.json({ success: true, data: broadcast });
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await setBroadcast({
      enabled: Boolean(body.enabled),
      message: String(body.message || '').trim(),
      level: body.level || 'info',
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { saveDomCapture, getCapturedScreens, getRecentCaptures } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ success: false, error: 'Empty body' }, { status: 400 });
    }

    // Support both nested { cspCode, appVersion, data: { ... } } and flat object
    const rawData = body.data || body;
    const cspCode = (body.cspCode || rawData.cspCode || 'UNKNOWN').toString().trim();
    const appVersion = (body.appVersion || rawData.appVersion || '').toString().trim();

    const snapshot = await saveDomCapture({
      cspCode: cspCode || 'UNKNOWN',
      appVersion: appVersion || undefined,
      urlPath: (rawData.urlPath || '').toString().slice(0, 300),
      pageTitle: (rawData.pageTitle || 'Untitled Screen').toString().slice(0, 150),
      activeMenu: rawData.activeMenu ? rawData.activeMenu.toString().slice(0, 150) : undefined,
      bodyPreview: rawData.bodyPreview ? rawData.bodyPreview.toString().slice(0, 500) : undefined,
      inputs: Array.isArray(rawData.inputs) ? rawData.inputs.slice(0, 50) : [],
      buttons: Array.isArray(rawData.buttons) ? rawData.buttons.slice(0, 40) : [],
      hasModal: Boolean(rawData.hasModal),
      modalTitle: rawData.modalTitle ? rawData.modalTitle.toString().slice(0, 150) : undefined,
      modalHtml: rawData.modalHtml ? rawData.modalHtml.toString().slice(0, 8000) : undefined,
    });

    return NextResponse.json({
      success: true,
      screenKey: snapshot.screenKey,
      capturedAt: snapshot.capturedAt,
    });
  } catch (error: any) {
    console.error('DOM capture POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'screens';

    if (mode === 'recent') {
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const recent = await getRecentCaptures(limit);
      return NextResponse.json({ success: true, count: recent.length, data: recent });
    }

    const screens = await getCapturedScreens();
    return NextResponse.json({ success: true, count: screens.length, data: screens });
  } catch (error: any) {
    console.error('DOM capture GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

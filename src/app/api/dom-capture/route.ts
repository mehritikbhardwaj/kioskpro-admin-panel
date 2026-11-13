import { NextRequest, NextResponse } from 'next/server';
import { 
  saveDomCapture, 
  getCapturedScreens, 
  getRecentCaptures, 
  isRemoteScreenshotEnabled, 
  setRemoteScreenshotToggle,
  saveScreenScreenshot
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    const body = await req.json();
    if (!body) {
      return NextResponse.json({ success: false, error: 'Empty body' }, { status: 400 });
    }

    // 1. Toggle Endpoint
    if (mode === 'toggle') {
      const enabled = Boolean(body.enabled);
      const cspCode = body.cspCode ? body.cspCode.toString().trim() : undefined;
      await setRemoteScreenshotToggle(enabled, cspCode);
      return NextResponse.json({ success: true, enabled, cspCode: cspCode || 'GLOBAL' });
    }

    // 2. Direct Screenshot Upload
    if (mode === 'screenshot' || (body.screenKey && body.screenshotBase64 && !body.inputs)) {
      const screenKey = body.screenKey;
      const base64 = body.screenshotBase64;
      await saveScreenScreenshot(screenKey, base64);
      return NextResponse.json({ success: true, screenKey, screenshotSaved: true });
    }

    // 3. Regular DOM Snapshot Upload
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
      radios: Array.isArray(rawData.radios) ? rawData.radios.slice(0, 30) : undefined,
      selects: Array.isArray(rawData.selects) ? rawData.selects.slice(0, 20) : undefined,
      buttons: Array.isArray(rawData.buttons) ? rawData.buttons.slice(0, 50) : [],
      tableHeaders: Array.isArray(rawData.tableHeaders) ? rawData.tableHeaders.slice(0, 30) : undefined,
      hasModal: Boolean(rawData.hasModal),
      modalTitle: rawData.modalTitle ? rawData.modalTitle.toString().slice(0, 150) : undefined,
      modalHtml: rawData.modalHtml ? rawData.modalHtml.toString().slice(0, 8000) : undefined,
      screenshotBase64: rawData.screenshotBase64 ? rawData.screenshotBase64.toString() : undefined,
    });

    // Check if remote screenshot capture is currently requested by Admin for this CSP or globally
    const requestScreenshot = await isRemoteScreenshotEnabled(cspCode);

    return NextResponse.json({
      success: true,
      screenKey: snapshot.screenKey,
      capturedAt: snapshot.capturedAt,
      requestScreenshot,
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

    if (mode === 'toggle') {
      const cspCode = searchParams.get('csp_code') || undefined;
      const enabled = await isRemoteScreenshotEnabled(cspCode);
      return NextResponse.json({ success: true, enabled, cspCode: cspCode || 'GLOBAL' });
    }

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

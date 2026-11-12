import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isZip = searchParams.get('zip') === 'true' || searchParams.get('format') === 'zip';
  const isLegacy = searchParams.get('type') === 'standalone' || searchParams.get('legacy') === 'true';

  let downloadUrl = '';
  if (isLegacy) {
    downloadUrl = isZip
      ? 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro.exe.zip'
      : 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro.exe';
  } else {
    downloadUrl = isZip
      ? 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro_Setup.exe.zip'
      : 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro_Setup.exe';
  }

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

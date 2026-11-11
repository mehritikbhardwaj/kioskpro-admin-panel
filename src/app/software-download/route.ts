import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isZip = searchParams.get('zip') === 'true' || searchParams.get('format') === 'zip';

  const downloadUrl = isZip
    ? 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro.exe.zip'
    : 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro.exe';

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

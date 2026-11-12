import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rules = {
    version: '2.1.2',
    latestAppVersion: '2.1.2',
    appDownloadUrl: 'https://kioskpro-admin-panel.vercel.app/software-download',
    patchDownloadUrl: 'https://github.com/mehritikbhardwaj/kioskpro-rules/releases/latest/download/KioskPro_Patch.zip',
    releaseNotes: 'KioskPro v2.1.2 - Added Mandatory Mobile & WhatsApp Number Capture, Smart Biometric Auto-Retry Engine, 1-Keystroke Modal Pre-population, Digitally Signed Standalone Build.',
    selectors: {
      gps_connect: "button:contains('CONNECT'), input[value*='CONNECT']",
      gps_get_location: "button:contains('GET LOCATION'), input[value*='GET LOCATION']",
      gps_proceed: "button:contains('PROCEED'), input[value*='PROCEED'], button.proceedbutton",
      aeps_proceed: 'button.proceedbutton, button#btnProceed',
      login_proceed: "button[type='submit'], button.proceedbutton"
    },
    dynamicPatches: [
      {
        name: 'SBI_GPS_Handler',
        urlFilter: 'unify',
        script: '// Dynamic patch injected automatically on all SBI Unify pages'
      }
    ],
    customJs: "(function() { if (window.navigator && window.navigator.serial) { try { var _orig = window.navigator.serial.requestPort; window.navigator.serial.requestPort = async function(opts) { try { var ports = await window.navigator.serial.getPorts(); if (ports && ports.length > 0) { var target = null; for (var i = 0; i < ports.length; i++) { var inf = ports[i].getInfo ? ports[i].getInfo() : {}; var vid = inf.usbVendorId; if (vid !== 0x079b && vid !== 1947 && vid !== 0x1234 && vid !== 4660 && vid !== 0x2808) { target = ports[i]; } } if (!target && ports.length > 0) target = ports[ports.length - 1]; if (target) return target; } } catch(e) {} return _orig.call(window.navigator.serial, opts); }; } catch(e) {} } })();"
  };

  return NextResponse.json(rules, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Surrogate-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

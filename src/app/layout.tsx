import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KioskPro Admin | Cloud License & Device Manager',
  description: 'Enterprise Cloud Dashboard for SBI KioskPro Terminal Licenses & Dynamic Remote Controls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

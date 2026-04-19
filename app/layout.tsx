import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '../components/BottomNav';
import { AuthGuard } from '../components/AuthGuard';
import { RealtimeProvider } from '../components/RealtimeProvider';
import { MatchPopup } from '../components/MatchPopup';
import { LikePopup } from '../components/LikePopup';
import { PushTokenBridge } from '../components/PushTokenBridge';

export const metadata: Metadata = {
  title: 'HowWeMet',
  description: 'אפליקציית היכרויות',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <AuthGuard>
          <RealtimeProvider>
            <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-white shadow-xl shadow-gray-100">
              <main className="flex-1 pb-20 overflow-y-auto">{children}</main>
              <BottomNav />
            </div>
            <MatchPopup />
            <LikePopup />
            <PushTokenBridge />
          </RealtimeProvider>
        </AuthGuard>
      </body>
    </html>
  );
}

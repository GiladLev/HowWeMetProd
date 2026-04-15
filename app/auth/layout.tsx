'use client';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] bg-white flex flex-col overflow-hidden" dir="rtl">
      {children}
    </div>
  );
}
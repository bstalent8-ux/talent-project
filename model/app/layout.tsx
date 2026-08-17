import type { Metadata } from 'next';
import { Cairo, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Maya Khaled | Professional Model | TALENTS',
  description: 'منصة مواهب - الملف التعريفي للموديل الاحترافي مايا خالد مع استعراض الأعمال، الباقات، التقييمات والحجز المباشر',
  openGraph: {
    title: 'Maya Khaled | Professional Model | TALENTS',
    description: 'موديل احترافي بخبرة في التصوير التجاري والأزياء والإعلانات في القاهرة، مصر',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${cairo.variable} ${plusJakarta.variable}`}>
      <body
        className={`${cairo.className} bg-[#080b11] text-slate-100 antialiased min-h-screen selection:bg-amber-500/30 selection:text-amber-200`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

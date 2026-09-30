import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const name = process.env.NEXT_PUBLIC_APP_NAME || 'JobReady Resume';

export const metadata: Metadata = {
  title: { default: `${name} — Job-ready resume in 5 minutes`, template: `%s | ${name}` },
  description: 'Make a job-specific resume based on your qualification. First resume free. PDF, Word & Print. Check if you are ready for the job.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#2553e0' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

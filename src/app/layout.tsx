import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'CivicPulse — AI-Assisted Urban Issue Prioritisation & Resource Allocation',
  description:
    'CivicPulse connects citizen reporting, ward operations and central oversight—supporting clearer priorities, better resource planning and transparent progress in Mira Bhayandar.',
  keywords: [
    'CivicPulse',
    'Mira Bhayandar',
    'Urban Issue Prioritization',
    'Municipal Resource Allocation',
    'Citizen Grievance Redressal',
    'Roads',
    'Water',
    'Waste',
    'Streetlights',
    'Drainage',
    'Traffic',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f1729',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

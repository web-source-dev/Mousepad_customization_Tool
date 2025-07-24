import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from "@/components/ui/cart-context";

export const metadata: Metadata = {
  title: 'Custom Mousepad Designer | Create Your Perfect Gaming Surface',
  description: 'Design and customize your own unique mousepad with our advanced editor. Choose from gaming, abstract, nature, and space themes. Perfect for gamers, professionals, and enthusiasts.',
  keywords: 'custom mousepad, gaming mousepad, mousepad designer, personalized mousepad, gaming accessories, desk mat, RGB mousepad, gaming surface',
  authors: [{ name: 'Mousepad Customizer' }],
  creator: 'Mousepad Customizer',
  publisher: 'Mousepad Customizer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://evogear.rtnglobal.co/'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Custom Mousepad Designer | Create Your Perfect Gaming Surface',
    description: 'Design and customize your own unique mousepad with our advanced editor. Choose from gaming, abstract, nature, and space themes.',
    url: 'https://evogear.rtnglobal.co/',
    siteName: 'Mousepad Customizer',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Custom Mousepad Designer',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Mousepad Designer | Create Your Perfect Gaming Surface',
    description: 'Design and customize your own unique mousepad with our advanced editor.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <CartProvider>
            {children}
        </CartProvider>
      </body>
    </html>
  );
}

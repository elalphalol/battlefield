import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@coinbase/onchainkit/styles.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Whole Number War - BTC Strategy Battle',
  description: 'The Battle Between RED ARMY (Shorts) vs GREEN ARMY (Longs) - Farcaster Mini App',
  openGraph: {
    type: 'website',
    title: 'Whole Number War',
    description: 'Bitcoin strategy battle game in Farcaster',
    images: [`${appUrl}/opengraph-image.png`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${appUrl}/opengraph-image.png`,
    'fc:frame:button:1': 'Launch App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': appUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@coinbase/onchainkit/styles.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'BATTLEFIELD - Bears vs Bulls Bitcoin Trading Game',
  description: '⚔️ Bears 🐻 vs Bulls 🐂 | Paper trade Bitcoin with 100x leverage. Your army claims YOU based on your winning trades. Compete for $BATTLE tokens!',
  openGraph: {
    type: 'website',
    title: 'BATTLEFIELD - Bears vs Bulls',
    description: 'Bitcoin leverage trading battle game. Your army is determined by your winning positions. Compete for $BATTLE tokens!',
    images: [`${appUrl}/opengraph-image.png`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${appUrl}/opengraph-image.png`,
    'fc:frame:button:1': 'Enter The Battlefield',
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

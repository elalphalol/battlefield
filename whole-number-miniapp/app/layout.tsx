import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@coinbase/onchainkit/styles.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://battlefield-roan.vercel.app';

// Mini App embed JSON for fc:miniapp meta tag (3:2 ratio image required)
const miniappEmbed = JSON.stringify({
  version: "1",
  imageUrl: `${appUrl}/miniapp-embed.jpg`,
  button: {
    title: "Play Battlefield",
    action: {
      type: "launch_frame",
      url: appUrl,
      name: "Battlefield",
      splashImageUrl: `${appUrl}/battlefield-icon-200.png`,
      splashBackgroundColor: "#0a0a0a"
    }
  }
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Battlefield - Bears vs Bulls Bitcoin Trading Game',
  description: '⚔️ Bears 🐻 vs Bulls 🐂 | Paper trade Bitcoin with 200x leverage. Master the Whole Number Strategy. Compete for $BATTLE tokens!',
  openGraph: {
    type: 'website',
    url: appUrl,
    title: 'Battlefield - Bitcoin Paper Trading Arena',
    description: 'Paper trade Bitcoin up to 200x leverage. Bulls vs Bears. Educational, competitive, and earn $BATTLE tokens!',
    siteName: 'Battlefield',
    images: [
      {
        url: `${appUrl}/miniapp-embed.jpg`,
        width: 1200,
        height: 800,
        alt: 'Battlefield - Bitcoin Trading Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Battlefield - Bitcoin Paper Trading',
    description: 'Paper trade Bitcoin with 200x leverage. Join Bulls or Bears army!',
    images: [`${appUrl}/miniapp-embed.jpg`],
  },
  other: {
    // Farcaster Mini App embed meta tag (required for thumbnail in casts)
    'fc:miniapp': miniappEmbed,
    // Legacy fc:frame for backward compatibility
    'fc:frame': 'vNext',
    'fc:frame:image': `${appUrl}/miniapp-embed.jpg`,
    'fc:frame:image:aspect_ratio': '3:2',
    'fc:frame:button:1': 'Play Battlefield ⚔️',
    'fc:frame:button:1:action': 'launch_frame',
    'fc:frame:button:1:target': appUrl,
    'og:image': `${appUrl}/miniapp-embed.jpg`,
    'og:image:width': '1200',
    'og:image:height': '800',
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

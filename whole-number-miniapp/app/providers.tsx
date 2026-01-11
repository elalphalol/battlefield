'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { ReactNode } from 'react';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
      showQrModal: true,
      metadata: {
        name: 'Battlefield',
        description: 'Bears vs Bulls Bitcoin Paper Trading',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://battlefield-mini.vercel.app',
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/opengraph-image.jpg` : 'https://battlefield-mini.vercel.app/opengraph-image.jpg']
      },
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '99999'
        },
        explorerRecommendedWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        ],
        mobileWallets: [
          {
            id: 'coinbase',
            name: 'Coinbase Wallet',
            links: {
              native: 'cbwallet://',
              universal: 'https://go.cb-w.com'
            }
          },
          {
            id: 'trust',
            name: 'Trust Wallet',
            links: {
              native: 'trust://',
              universal: 'https://link.trustwallet.com'
            }
          },
          {
            id: 'rainbow',
            name: 'Rainbow',
            links: {
              native: 'rainbow://',
              universal: 'https://rainbow.me'
            }
          },
          {
            id: 'metamask',
            name: 'MetaMask',
            links: {
              native: 'metamask://',
              universal: 'https://metamask.app.link'
            }
          }
        ]
      }
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

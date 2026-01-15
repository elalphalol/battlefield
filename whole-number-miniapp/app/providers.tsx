'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { ReactNode, useEffect } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { Toaster } from 'react-hot-toast';
import { TwemojiProvider } from './components/TwemojiProvider';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    // MetaMask SDK connector - handles mobile deep linking automatically
    metaMask({
      dappMetadata: {
        name: 'Battlefield',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://btcbattlefield.com',
        iconUrl: typeof window !== 'undefined' ? `${window.location.origin}/battlefield-logo.jpg` : 'https://btcbattlefield.com/battlefield-logo.jpg',
      },
    }),
    // Coinbase Wallet SDK - has great mobile support
    coinbaseWallet({
      appName: 'Battlefield',
      appLogoUrl: typeof window !== 'undefined' ? `${window.location.origin}/battlefield-logo.jpg` : 'https://btcbattlefield.com/battlefield-logo.jpg',
    }),
    // Generic injected (for in-app browsers and other wallets)
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  // Call Farcaster SDK ready when component mounts
  useEffect(() => {
    const initSdk = async () => {
      try {
        await sdk.actions.ready();
        console.log('Farcaster SDK ready');
      } catch (error) {
        console.log('Not in Farcaster context:', error);
      }
    };
    initSdk();
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: 'auto',
              name: 'Battlefield',
              logo: 'https://btcbattlefield.com/battlefield-icon-200.png',
            },
          }}
          miniKit={{
            enabled: true,
          }}
        >
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '2px solid #475569',
                borderRadius: '0.5rem',
                fontSize: '14px',
                fontWeight: '600',
              },
              success: {
                duration: 2500,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <TwemojiProvider>
            {children}
          </TwemojiProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

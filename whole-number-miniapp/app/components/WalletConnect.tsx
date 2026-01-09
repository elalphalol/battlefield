'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { 
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { getFarcasterUser, isInFarcasterFrame } from '../lib/minikit';

export function WalletConnect() {
  const { address } = useAccount();
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [isInFrame, setIsInFrame] = useState(false);

  useEffect(() => {
    // Check if we're in a Farcaster frame
    const inFrame = isInFarcasterFrame();
    setIsInFrame(inFrame);

    // If in frame, get Farcaster user info
    if (inFrame) {
      getFarcasterUser().then(user => {
        console.log('Farcaster user loaded:', user);
        setFarcasterUser(user);
      });
    }
  }, []);

  // If in Farcaster frame and have user data, show Farcaster identity
  if (isInFrame && farcasterUser) {
    return (
      <div className="bg-slate-800 border-2 border-blue-500 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          {farcasterUser.pfpUrl && (
            <img 
              src={farcasterUser.pfpUrl} 
              alt={farcasterUser.username} 
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="text-left">
            <div className="font-bold text-white text-sm">
              {farcasterUser.username || farcasterUser.displayName || 'Farcaster User'}
            </div>
            <div className="text-xs text-gray-400">
              FID: {farcasterUser.fid}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If in Farcaster frame but no user yet, show loading
  if (isInFrame && !farcasterUser) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-2">
        <div className="text-gray-400 text-sm">Loading Farcaster...</div>
      </div>
    );
  }

  // Otherwise use regular OnchainKit wallet connect
  return (
    <div className="wallet-container">
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className="text-gray-400" />
            <EthBalance />
          </Identity>
          <WalletDropdownLink
            icon="wallet"
            href="https://keys.coinbase.com"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}

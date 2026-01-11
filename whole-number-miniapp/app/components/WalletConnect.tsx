'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import { farcasterAuth, type FarcasterUser } from '../lib/farcaster';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [farcasterConnecting, setFarcasterConnecting] = useState(false);

  // Initialize Farcaster SDK on mount
  useEffect(() => {
    const initFarcaster = async () => {
      const initialized = await farcasterAuth.initialize();
      setIsInFarcaster(initialized);
      
      if (initialized) {
        const user = await farcasterAuth.getFarcasterUser();
        if (user) {
          setFarcasterUser(user);
          console.log('Farcaster user detected:', user);
        }
      }
    };
    
    initFarcaster();
  }, []);

  // Handle Farcaster sign-in
  const handleFarcasterSignIn = async () => {
    setFarcasterConnecting(true);
    try {
      const result = await farcasterAuth.signInWithFarcaster();
      if (result) {
        const { farcasterUser, walletAddress } = result;
        
        // Register user on backend
        await farcasterAuth.registerUser(farcasterUser, walletAddress);
        
        setFarcasterUser(farcasterUser);
        setShowModal(false);
        
        // Show success message
        console.log('✅ Farcaster authentication successful!');
      }
    } catch (error) {
      console.error('Farcaster sign-in error:', error);
      // Only log error, don't show alert - user can try wallet connection instead
    } finally {
      setFarcasterConnecting(false);
    }
  };

  // Connected state (either wallet or Farcaster)
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className="bg-slate-800 border-2 border-blue-500 rounded-lg px-4 py-2 text-white hover:bg-slate-700 flex items-center gap-2"
        >
          {farcasterUser && (
            <span className="text-purple-400">🎭</span>
          )}
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        
        {showModal && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-2">Connected</div>
              {farcasterUser && (
                <div className="mb-3 p-2 bg-purple-900/30 border border-purple-500/30 rounded">
                  <div className="text-purple-400 text-xs mb-1">🎭 Farcaster</div>
                  <div className="text-white font-semibold text-sm">
                    {farcasterUser.username || farcasterUser.displayName || `FID ${farcasterUser.fid}`}
                  </div>
                  <div className="text-gray-400 text-xs">FID: {farcasterUser.fid}</div>
                </div>
              )}
              <div className="text-white font-mono text-sm mb-4">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setFarcasterUser(null);
                  setShowModal(false);
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Farcaster-only state (has Farcaster user but not wallet connected)
  if (isInFarcaster && farcasterUser) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all duration-200 hover:shadow-xl flex items-center gap-2"
        >
          🎭 {farcasterUser.username || `FID ${farcasterUser.fid}`}
        </button>
        
        {showModal && (
          <div className="absolute right-0 mt-2 w-80 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <div className="text-white font-bold mb-3">Farcaster Profile</div>
              <div className="mb-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded">
                <div className="flex items-center gap-3 mb-2">
                  {farcasterUser.pfpUrl && (
                    <img src={farcasterUser.pfpUrl} alt="Profile" className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <div className="text-white font-semibold">
                      {farcasterUser.username || farcasterUser.displayName}
                    </div>
                    <div className="text-gray-400 text-xs">FID: {farcasterUser.fid}</div>
                  </div>
                </div>
                {farcasterUser.verifications && farcasterUser.verifications.length > 0 && (
                  <div className="text-xs text-gray-400 mt-2">
                    <div className="text-green-400 mb-1">✅ Verified Address:</div>
                    <div className="font-mono text-white">
                      {farcasterUser.verifications[0].slice(0, 6)}...{farcasterUser.verifications[0].slice(-4)}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not connected state - show connection options
  return (
    <div className="relative">
      <button
        onClick={() => setShowModal(!showModal)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all duration-200 hover:shadow-xl"
      >
        🔗 Connect Wallet
      </button>
      
      {showModal && (
        <>
          {/* Backdrop - clicking closes modal */}
          <div 
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal - ALWAYS fixed at bottom on mobile, dropdown on desktop */}
          <div className="fixed md:absolute 
                          left-0 right-0 
                          md:right-0 md:left-auto 
                          bottom-0 md:bottom-auto 
                          md:top-full md:mt-2 
                          w-full md:w-80 
                          bg-slate-800 border-2 border-slate-700 
                          rounded-t-2xl md:rounded-lg 
                          shadow-2xl z-[9999] 
                          max-h-[70vh] overflow-y-auto">
            <div className="p-5 pb-8">
              {/* Mobile drag handle */}
              <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-4 md:hidden" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-white font-bold text-lg">Connect</div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Farcaster Sign In - ALWAYS show, works on farcaster.xyz too */}
                {!farcasterUser && (
                  <button
                    onClick={handleFarcasterSignIn}
                    disabled={farcasterConnecting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-lg font-bold text-left px-4 flex items-center justify-between disabled:opacity-50 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎭</span>
                      <div>
                        <div className="font-bold">Sign in with Farcaster</div>
                        <div className="text-xs text-purple-200">
                          {isInFarcaster ? 'Recommended in Warpcast' : 'Works on farcaster.xyz'}
                        </div>
                      </div>
                    </div>
                    {farcasterConnecting && <span className="animate-spin">⏳</span>}
                  </button>
                )}

                {/* Wallet connection options */}
                <div className="text-gray-400 text-xs mt-4 mb-2">
                  Or connect with wallet:
                </div>
                
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => {
                      try {
                        connect({ connector });
                        // Don't close immediately for mobile - let user complete action
                        setTimeout(() => setShowModal(false), 500);
                      } catch (error) {
                        console.error('Connection error:', error);
                      }
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white py-4 rounded-lg font-bold text-left px-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {connector.id === 'injected' ? '🦊' : 
                         connector.id === 'walletConnect' ? '📱' : 
                         '💼'}
                      </span>
                      <div>
                        <div className="font-bold">
                          {connector.id === 'injected' ? 'Browser Wallet' : 
                           connector.id === 'walletConnect' ? 'Mobile Wallets' : 
                           connector.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {connector.id === 'injected' ? 'Rabby, MetaMask, etc.' : 
                           connector.id === 'walletConnect' ? 'Trust, Rainbow, Coinbase' : 
                           ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                ))}
              </div>

              {/* Help text */}
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-gray-300">
                <div className="font-semibold text-blue-400 mb-1">💡 Tip</div>
                {isInFarcaster 
                  ? 'Use Farcaster sign-in to automatically link your profile and wallet!'
                  : 'Connect your wallet to start paper trading on the Battlefield!'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

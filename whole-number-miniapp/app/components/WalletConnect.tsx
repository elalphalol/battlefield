'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { farcasterAuth, type FarcasterUser } from '../lib/farcaster';

// Farcaster icon component
const FarcasterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <img
    src="/farcaster-icon.svg"
    alt=""
    className={className}
  />
);

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [farcasterConnecting, setFarcasterConnecting] = useState(false);
  const autoConnectAttempted = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Log connection errors
  useEffect(() => {
    if (connectError) {
      console.error('Wallet connection error:', connectError);
    }
  }, [connectError]);

  // Track if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Farcaster SDK on mount
  useEffect(() => {
    const initFarcaster = async () => {
      const initialized = await farcasterAuth.initialize();

      if (initialized) {
        const user = await farcasterAuth.getFarcasterUser();
        if (user && user.fid) {
          setIsInFarcaster(true);
          setFarcasterUser(user);
          console.log('Farcaster user detected:', user);
        } else {
          setIsInFarcaster(false);
          console.log('Farcaster SDK initialized but no user - regular browser');
        }
      } else {
        setIsInFarcaster(false);
      }
    };

    initFarcaster();
  }, []);

  // Auto-connect using Farcaster connector when in Farcaster frame
  useEffect(() => {
    const autoConnectFarcaster = async () => {
      if (autoConnectAttempted.current || !isInFarcaster || isConnected) {
        return;
      }

      autoConnectAttempted.current = true;

      const farcasterConnector = connectors.find(c =>
        c.id === 'farcasterMiniApp' || c.name.toLowerCase().includes('farcaster')
      );

      if (farcasterConnector) {
        console.log('Auto-connecting with Farcaster connector...');
        try {
          connect({ connector: farcasterConnector });
        } catch (error) {
          console.log('Auto-connect failed, user can connect manually:', error);
        }
      }
    };

    const timer = setTimeout(autoConnectFarcaster, 500);
    return () => clearTimeout(timer);
  }, [isInFarcaster, isConnected, connectors, connect]);

  // When wallet connects in Farcaster frame, update profile with Farcaster data
  useEffect(() => {
    const updateFarcasterData = async () => {
      if (isConnected && address && isInFarcaster) {
        if (!farcasterUser) {
          const user = await farcasterAuth.getFarcasterUser();
          if (user) {
            setFarcasterUser(user);
            await farcasterAuth.updateExistingUser(address);
          }
        } else {
          await farcasterAuth.updateExistingUser(address);
        }
      }
    };

    updateFarcasterData();
  }, [isConnected, address, isInFarcaster, farcasterUser]);

  // Handle Farcaster sign-in
  const handleFarcasterSignIn = async () => {
    setFarcasterConnecting(true);
    try {
      const result = await farcasterAuth.signInWithFarcaster();
      if (result) {
        const { farcasterUser, walletAddress } = result;
        await farcasterAuth.registerUser(farcasterUser, walletAddress);
        setFarcasterUser(farcasterUser);
        setShowModal(false);
        console.log('Farcaster authentication successful!');
      }
    } catch (error) {
      console.error('Farcaster sign-in error:', error);
    } finally {
      setFarcasterConnecting(false);
    }
  };

  // Connected state
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className={`rounded-lg px-4 py-2 text-white flex items-center gap-2 ${
            farcasterUser
              ? 'bg-transparent border-2 border-[#8B5CF6] hover:bg-[#8B5CF6]/20'
              : 'bg-slate-800 border-2 border-blue-500 hover:bg-slate-700'
          }`}
        >
          {farcasterUser ? (
            <>
              <FarcasterIcon className="w-5 h-5" />
              <span className="font-semibold">{farcasterUser.username || farcasterUser.displayName || `FID ${farcasterUser.fid}`}</span>
            </>
          ) : (
            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
          )}
        </button>

        {showModal && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-2">Connected</div>
              {farcasterUser && (
                <div className="mb-3 p-2 bg-purple-900/30 border border-purple-500/30 rounded">
                  <div className="text-purple-400 text-xs mb-1 flex items-center gap-1"><FarcasterIcon className="w-3 h-3" /> Farcaster</div>
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
          className="bg-transparent border-2 border-[#8B5CF6] hover:bg-[#8B5CF6]/20 text-white px-6 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2"
        >
          <FarcasterIcon className="w-5 h-5" />
          {farcasterUser.username || `FID ${farcasterUser.fid}`}
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

      {showModal && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowModal(false)}
          />

          {/* Modal - Bottom sheet */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-slate-800 border-t-2 border-slate-600 rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
          >
            <div className="p-5 pb-8">
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-slate-500 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <div className="text-white font-bold text-lg">Connect Wallet</div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-3xl leading-none w-10 h-10 flex items-center justify-center bg-slate-700 rounded-full"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {/* Farcaster Sign In - ONLY show when in Farcaster Frame (Warpcast) */}
                {isInFarcaster && !farcasterUser && (
                  <>
                    <button
                      onClick={handleFarcasterSignIn}
                      disabled={farcasterConnecting}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-lg font-bold text-left px-4 flex items-center justify-between disabled:opacity-50 shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎭</span>
                        <div>
                          <div className="font-bold">Sign in with Farcaster</div>
                          <div className="text-xs text-purple-200">Recommended in Warpcast</div>
                        </div>
                      </div>
                      {farcasterConnecting && <span className="animate-spin">⏳</span>}
                    </button>
                    <div className="text-center text-gray-400 text-xs">OR</div>
                  </>
                )}

                {/* Wallet connection options */}
                <div className="text-gray-400 text-xs mb-2 font-semibold">
                  {isInFarcaster ? 'Connect with wallet:' : 'Select wallet to connect:'}
                </div>

                {/* Wallet options - different for mobile vs desktop */}
                {(() => {
                  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                  // Find specific connectors
                  const metaMaskConnector = connectors.find(c => c.id === 'metaMaskSDK' || c.id === 'metaMask');
                  const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK' || c.id === 'coinbaseWallet');
                  const injectedConnector = connectors.find(c => c.id === 'injected');

                  if (isMobile && !isInFarcaster) {
                    // Mobile browser - show SDK-powered buttons
                    return (
                      <>
                        {/* Info about how it works */}
                        <div className="mb-3 p-3 bg-slate-700/50 rounded-lg text-xs text-gray-300">
                          <div className="font-semibold text-white mb-1">How it works:</div>
                          <div>1. Tap your wallet below</div>
                          <div>2. Approve in your wallet app</div>
                          <div>3. Return here - you&apos;ll be connected!</div>
                        </div>

                        {/* MetaMask - uses SDK with deep linking */}
                        {metaMaskConnector && (
                          <button
                            onClick={() => {
                              console.log('Connecting with MetaMask SDK...');
                              setShowModal(false);
                              setTimeout(() => {
                                connect({ connector: metaMaskConnector });
                              }, 100);
                            }}
                            className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-400 text-white py-4 rounded-lg font-bold text-left px-4 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🦊</span>
                              <div>
                                <div className="font-bold">MetaMask</div>
                                <div className="text-xs text-orange-200">Connect via MetaMask app</div>
                              </div>
                            </div>
                            <span className="text-orange-200">→</span>
                          </button>
                        )}

                        {/* Coinbase Wallet - uses SDK with mobile linking */}
                        {coinbaseConnector && (
                          <button
                            onClick={() => {
                              console.log('Connecting with Coinbase Wallet SDK...');
                              setShowModal(false);
                              setTimeout(() => {
                                connect({ connector: coinbaseConnector });
                              }, 100);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-400 text-white py-4 rounded-lg font-bold text-left px-4 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🔵</span>
                              <div>
                                <div className="font-bold">Coinbase Wallet</div>
                                <div className="text-xs text-blue-200">Connect via Coinbase app</div>
                              </div>
                            </div>
                            <span className="text-blue-200">→</span>
                          </button>
                        )}

                        <div className="text-center text-gray-500 text-xs mt-3">
                          Connection stays in this browser
                        </div>
                      </>
                    );
                  }

                  // Desktop or Farcaster - show appropriate connectors
                  const desktopConnectors = isInFarcaster
                    ? connectors.filter(c => c.id === 'farcasterMiniApp')
                    : connectors.filter(c =>
                        c.id === 'injected' ||
                        c.id === 'metaMaskSDK' ||
                        c.id === 'metaMask' ||
                        c.id === 'coinbaseWalletSDK' ||
                        c.id === 'coinbaseWallet'
                      );

                  // Helper to get connector display info
                  const getConnectorInfo = (id: string) => {
                    switch (id) {
                      case 'injected':
                        return { icon: '🌐', name: 'Browser Wallet', desc: 'Use detected wallet' };
                      case 'metaMaskSDK':
                      case 'metaMask':
                        return { icon: '🦊', name: 'MetaMask', desc: 'Connect via extension' };
                      case 'coinbaseWalletSDK':
                      case 'coinbaseWallet':
                        return { icon: '🔵', name: 'Coinbase Wallet', desc: 'Connect via extension' };
                      case 'farcasterMiniApp':
                        return { icon: '🎭', name: 'Farcaster Wallet', desc: 'Connected via Warpcast' };
                      default:
                        return { icon: '💼', name: id, desc: '' };
                    }
                  };

                  return desktopConnectors
                    .map((connector) => {
                      const info = getConnectorInfo(connector.id);
                      return (
                        <button
                          key={connector.id}
                          onClick={() => {
                            console.log('Connecting with:', connector.id, connector.name);
                            setShowModal(false);
                            setTimeout(() => {
                              connect({ connector });
                            }, 100);
                          }}
                          className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white py-4 rounded-lg font-bold text-left px-4 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{info.icon}</span>
                            <div>
                              <div className="font-bold">{info.name}</div>
                              {info.desc && <div className="text-xs text-gray-400">{info.desc}</div>}
                            </div>
                          </div>
                          <span className="text-gray-400">→</span>
                        </button>
                      );
                    });
                })()}
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
        </div>,
        document.body
      )}
    </div>
  );
}

'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className="bg-slate-800 border-2 border-blue-500 rounded-lg px-4 py-2 text-white hover:bg-slate-700"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        
        {showModal && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <div className="text-sm text-gray-400 mb-2">Connected</div>
              <div className="text-white font-mono text-sm mb-4">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <button
                onClick={() => {
                  disconnect();
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

  const injectedConnector = connectors.find(c => c.id === 'injected');
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');

  return (
    <div className="relative">
      <button
        onClick={() => setShowModal(!showModal)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all duration-200 hover:shadow-xl"
      >
        🔗 Connect Wallet
      </button>
      
      {showModal && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl z-50 max-h-[500px] overflow-y-auto">
          <div className="p-4">
            <div className="text-white font-bold mb-3">Select Wallet</div>
            <div className="space-y-2">
              {/* Browser Wallet */}
              <button
                onClick={() => {
                  if (injectedConnector) {
                    connect({ connector: injectedConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold text-left px-4 flex items-center gap-3"
              >
                <span className="text-2xl">🦊</span>
                <span>Browser Wallet</span>
              </button>

              {/* Mobile Wallets via WalletConnect */}
              <button
                onClick={() => {
                  if (walletConnectConnector) {
                    connect({ connector: walletConnectConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold text-left px-4 flex items-center gap-3"
              >
                <span className="text-2xl">📱</span>
                <span>Mobile Wallets</span>
              </button>

              <div className="border-t border-slate-600 my-3"></div>
              <div className="text-xs text-gray-400 mb-2">Popular Wallets:</div>

              {/* Rabby Wallet */}
              <button
                onClick={() => {
                  if (injectedConnector) {
                    connect({ connector: injectedConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-left px-4 flex items-center gap-3"
              >
                <span className="text-xl">🐰</span>
                <span>Rabby Wallet</span>
              </button>

              {/* Phantom */}
              <button
                onClick={() => {
                  if (injectedConnector) {
                    connect({ connector: injectedConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-left px-4 flex items-center gap-3"
              >
                <span className="text-xl">👻</span>
                <span>Phantom</span>
              </button>

              {/* MetaMask */}
              <button
                onClick={() => {
                  if (injectedConnector) {
                    connect({ connector: injectedConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-left px-4 flex items-center gap-3"
              >
                <span className="text-xl">🦊</span>
                <span>MetaMask</span>
              </button>

              {/* Coinbase Wallet */}
              <button
                onClick={() => {
                  if (walletConnectConnector) {
                    connect({ connector: walletConnectConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-left px-4 flex items-center gap-3"
              >
                <span className="text-xl">💙</span>
                <span>Coinbase Wallet</span>
              </button>

              {/* OKX Wallet */}
              <button
                onClick={() => {
                  if (walletConnectConnector) {
                    connect({ connector: walletConnectConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-left px-4 flex items-center gap-3"
              >
                <span className="text-xl">⭕</span>
                <span>OKX Wallet</span>
              </button>

              {/* Trust Wallet */}
              <button
                onClick={() => {
                  if (walletConnectConnector) {
                    connect({ connector: walletConnectConnector });
                    setShowModal(false);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium text-left px-4 flex items-center gap-3"
              >
                <span className="text-xl">💎</span>
                <span>Trust Wallet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
